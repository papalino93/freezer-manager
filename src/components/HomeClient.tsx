"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductDTO } from "@/lib/types";
import type { SortOption } from "@/lib/product-schema";
import { getCategoryGroupFor, getCategoryGroupMeta } from "@/lib/categories";
import { computeSummary } from "@/lib/summary";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { PriorityCard } from "@/components/PriorityCard";
import { SearchBar } from "@/components/SearchBar";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SortSelect } from "@/components/SortSelect";
import { ProductList } from "@/components/ProductList";
import { EmptyState } from "@/components/EmptyState";
import { AddFab } from "@/components/AddFab";
import { InstallCard } from "@/components/InstallCard";
import { LocationFilterPills } from "@/components/LocationFilterPills";
import { SupportLink } from "@/components/SupportLink";
import { ConsumeToast, ConsumeToastError } from "@/components/ConsumeToast";
import { productToFormValues, formValuesToPayload } from "@/lib/form-values";

/** Cosa annullare col pulsante del toast: un consumo completo (il prodotto
 * torna nella lista) oppure solo di alcune unità (si ripristina la
 * quantità precedente, il prodotto non si era mai mosso dalla lista). */
type UndoAction =
  | { kind: "all"; message: string; product: ProductDTO }
  | { kind: "partial"; message: string; id: string; previousQuantity: string | null };

const UNDO_TOAST_MS = 5000;

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export function HomeClient() {
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);
  const [error, setError] = useState(false);

  // Derivato dai prodotti già scaricati invece che con una seconda chiamata
  // a /api/summary: un round-trip in meno ad ogni apertura dell'app, e resta
  // sempre coerente con la lista visibile.
  const summary = useMemo(() => (products ? computeSummary(products) : null), [products]);

  const [view, setView] = useState<ViewMode>("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [showPriority, setShowPriority] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("expiry-asc");

  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((t) => t + 1), []);

  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [undoError, setUndoError] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError(false);
      try {
        const res = await fetch(`/api/products?sort=${sort}`);
        if (!res.ok) throw new Error("request failed");
        const data = await res.json();
        if (ignore) return;
        setProducts(data.products);
      } catch {
        if (!ignore) setError(true);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [sort, reloadToken]);

  // Per il filtro "dove si trova" dentro una categoria: la lista dei
  // congelatori non cambia spesso, basta caricarla una volta.
  useEffect(() => {
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFreezers(data.freezers);
      })
      .catch(() => {});
  }, []);

  // Se in famiglia siete in più a guardare lo stesso congelatore, quando
  // torni sull'app (cambio scheda, riapertura da Home) ricarichiamo i
  // dati: così non vedi un prodotto che qualcun altro ha già consumato.
  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState === "visible") retry();
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [retry]);

  function armUndo(action: UndoAction) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoAction(action);
    undoTimerRef.current = setTimeout(() => setUndoAction(null), UNDO_TOAST_MS);
  }

  function handleConsumed(id: string) {
    const consumed = products?.find((p) => p.id === id) ?? null;
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    // Stessa ragione del retry() in handleUndo qui sotto: chiude una
    // ricarica già in corso che altrimenti potrebbe far ricomparire questo
    // prodotto con dati letti prima del consumo.
    retry();

    if (consumed) {
      armUndo({ kind: "all", message: `✓ ${consumed.name} consumato`, product: consumed });
    }
  }

  // Consumata solo un'unità (es. una scatola su cinque): il prodotto resta
  // attivo, si aggiorna solo la quantità mostrata, senza farlo sparire
  // dalla lista come per un consumo completo. L'annullamento qui era
  // rimasto indietro rispetto al consumo completo: si poteva sbagliare
  // quantità e l'unico modo per correggere era aprire "Modifica".
  function handleQuantityChanged(id: string, quantity: string | null) {
    const previous = products?.find((p) => p.id === id) ?? null;
    setProducts((prev) => (prev ? prev.map((p) => (p.id === id ? { ...p, quantity } : p)) : prev));

    if (previous) {
      armUndo({
        kind: "partial",
        message: `✓ ${previous.name}: quantità aggiornata`,
        id,
        previousQuantity: previous.quantity,
      });
    }
  }

  // Ripensamento immediato dopo aver segnato "Consumato" (punto emerso da
  // una domanda dell'utente): niente bisogno di passare dallo Storico.
  async function handleUndo() {
    const action = undoAction;
    if (!action) return;
    setUndoAction(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    function fail() {
      // Un annullamento fallito non deve sembrare riuscito (punto audit #3).
      setUndoError(true);
      undoTimerRef.current = setTimeout(() => setUndoError(false), UNDO_TOAST_MS);
    }

    if (action.kind === "all") {
      const res = await fetch(`/api/products/${action.product.id}/consume`, { method: "DELETE" });
      if (!res.ok) return fail();

      setProducts((prev) => (prev ? [action.product, ...prev] : prev));
    } else {
      const current = products?.find((p) => p.id === action.id);
      if (!current) return fail();

      const payload = {
        ...formValuesToPayload(productToFormValues(current)),
        quantity: action.previousQuantity,
      };
      const res = await fetch(`/api/products/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return fail();

      setProducts((prev) =>
        prev
          ? prev.map((p) => (p.id === action.id ? { ...p, quantity: action.previousQuantity } : p))
          : prev
      );
    }
    // Una ricarica innescata da poco (es. tornando sulla scheda) potrebbe
    // essere partita prima di questo annullamento e sovrascriverlo con dati
    // vecchi quando risponde: una ricarica fresca chiude la corsa, dato che
    // la richiesta qui sopra è già stata completata (punto audit #4).
    retry();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">
          Qualcosa è andato storto. Riprova.
        </p>
        <button
          type="button"
          onClick={retry}
          className="tap-target rounded-full bg-brand px-5 py-3 font-bold text-white"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!products || !summary) {
    return <p className="py-16 text-center text-muted">Caricamento…</p>;
  }

  if (summary.total === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Hero total={0} freezerCount={freezers?.length ?? null} />
        <EmptyState
          title="Il congelatore è vuoto"
          description="Quando aggiungerai qualcosa, lo troverai qui."
          showOnboardingActions
        />
        <SupportLink />
      </div>
    );
  }

  let visible = products;
  if (showPriority) {
    visible = visible.filter((p) => p.freshness.level === "red" || p.freshness.level === "orange");
  } else if (view === "category" && selectedCategory) {
    // selectedCategory è la chiave di un gruppo (es. "Piatti pronti e
    // sughi"): include tutti i valori raggruppati sotto, non solo quello
    // esatto — così una "Pizza" salvata anni fa si trova comunque.
    const group = getCategoryGroupFor(selectedCategory);
    visible = visible.filter((p) => group.values.includes(p.category));
    if (locationFilter) {
      visible = visible.filter((p) => p.freezerId === locationFilter);
    }
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    visible = visible.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
    );
  }

  const showCategoryGrid = view === "category" && !selectedCategory && !showPriority;
  const showLocationFilter =
    view === "category" && !!selectedCategory && !showPriority && !!freezers && freezers.length > 1;

  function selectCategory(category: string) {
    setSelectedCategory(category);
    setLocationFilter(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <Hero total={summary.total} freezerCount={freezers?.length ?? null} />
      <PriorityCard products={products} onSeeAll={() => setShowPriority(true)} />
      <SearchBar value={search} onChange={setSearch} />

      {!showPriority && (
        <ViewToggle
          value={view}
          onChange={(v) => {
            setView(v);
            setSelectedCategory(null);
            setLocationFilter(null);
          }}
        />
      )}

      {showPriority && (
        <FilterChip label="🔴 Da consumare prima" onClear={() => setShowPriority(false)} />
      )}

      {!showPriority && view === "category" && selectedCategory && (
        <FilterChip
          label={`${getCategoryGroupMeta(selectedCategory).emoji} ${
            getCategoryGroupMeta(selectedCategory).label
          }`}
          onClear={() => {
            setSelectedCategory(null);
            setLocationFilter(null);
          }}
        />
      )}

      {showLocationFilter && freezers && (
        <LocationFilterPills freezers={freezers} value={locationFilter} onChange={setLocationFilter} />
      )}

      {showCategoryGrid ? (
        <CategoryGrid summary={summary} onSelect={selectCategory} />
      ) : (
        <>
          {!showPriority && view === "expiry" && (
            <div className="flex justify-end">
              <SortSelect value={sort} onChange={setSort} />
            </div>
          )}
          {visible.length === 0 ? (
            <p className="rounded-2xl bg-surface px-4 py-6 text-center text-muted">
              {search.trim() ? `Nessun risultato per «${search.trim()}».` : "Nessun prodotto qui."}
            </p>
          ) : (
            <>
              <ProductList
                products={visible}
                sort={sort}
                onConsumed={handleConsumed}
                onQuantityChanged={handleQuantityChanged}
              />
              <InstallCard />
            </>
          )}
        </>
      )}

      <SupportLink />
      {undoAction && <ConsumeToast message={undoAction.message} onUndo={handleUndo} />}
      {undoError && <ConsumeToastError message="Non sono riuscito ad annullare. Riprova." />}
      <AddFab />
    </div>
  );
}

function Hero({ total, freezerCount }: { total: number; freezerCount: number | null }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">🧊 Il mio congelatore</h1>
      <p className="text-muted">
        {total} {total === 1 ? "prodotto" : "prodotti"}
        {freezerCount !== null &&
          ` · ${freezerCount} ${freezerCount === 1 ? "congelatore" : "congelatori"}`}
      </p>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 self-start rounded-full bg-surface py-1.5 pl-4 pr-1.5 text-sm font-semibold text-foreground">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label="Rimuovi filtro"
        className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}
