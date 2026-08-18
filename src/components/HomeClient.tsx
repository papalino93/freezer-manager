"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductDTO, SummaryDTO } from "@/lib/types";
import type { SortOption } from "@/lib/product-schema";
import { getCategoryMeta } from "@/lib/categories";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { AlertSummary } from "@/components/AlertSummary";
import { SearchBar } from "@/components/SearchBar";
import { CategoryGrid } from "@/components/CategoryGrid";
import { SortSelect } from "@/components/SortSelect";
import { ProductList } from "@/components/ProductList";
import { EmptyState } from "@/components/EmptyState";
import { AddFab } from "@/components/AddFab";
import { InstallCard } from "@/components/InstallCard";

export function HomeClient() {
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [summary, setSummary] = useState<SummaryDTO | null>(null);
  const [error, setError] = useState(false);

  const [view, setView] = useState<ViewMode>("expiry");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [freshnessFilter, setFreshnessFilter] = useState<"orange" | "red" | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("expiry-asc");

  const [reloadToken, setReloadToken] = useState(0);
  const retry = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError(false);
      try {
        const [productsRes, summaryRes] = await Promise.all([
          fetch(`/api/products?sort=${sort}`),
          fetch("/api/summary"),
        ]);
        if (!productsRes.ok || !summaryRes.ok) throw new Error("request failed");
        const productsData = await productsRes.json();
        const summaryData = await summaryRes.json();
        if (ignore) return;
        setProducts(productsData.products);
        setSummary(summaryData);
      } catch {
        if (!ignore) setError(true);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [sort, reloadToken]);

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

  function handleConsumed(id: string) {
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    setSummary((prev) => {
      if (!prev) return prev;
      const consumed = products?.find((p) => p.id === id);
      return {
        ...prev,
        total: Math.max(0, prev.total - 1),
        orange: consumed?.freshness.level === "orange" ? Math.max(0, prev.orange - 1) : prev.orange,
        red: consumed?.freshness.level === "red" ? Math.max(0, prev.red - 1) : prev.red,
      };
    });
  }

  function handleFreshnessFilter(filter: "orange" | "red" | null) {
    setFreshnessFilter(filter);
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
        <Hero total={0} />
        <EmptyState
          title="Il congelatore è vuoto"
          description="Quando aggiungerai qualcosa, lo troverai qui."
          showOnboardingActions
        />
      </div>
    );
  }

  let visible = products;
  if (freshnessFilter) {
    visible = visible.filter((p) => p.freshness.level === freshnessFilter);
  } else if (view === "category" && selectedCategory) {
    visible = visible.filter((p) => p.category === selectedCategory);
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

  const showCategoryGrid = view === "category" && !selectedCategory && !freshnessFilter;

  return (
    <div className="flex flex-col gap-5">
      <Hero total={summary.total} />
      <AlertSummary
        summary={summary}
        activeFilter={freshnessFilter}
        onFilterChange={handleFreshnessFilter}
      />
      <SearchBar value={search} onChange={setSearch} />

      {!freshnessFilter && (
        <ViewToggle
          value={view}
          onChange={(v) => {
            setView(v);
            setSelectedCategory(null);
          }}
        />
      )}

      {freshnessFilter && (
        <FilterChip
          label={
            freshnessFilter === "orange" ? "🟠 Da consumare presto" : "🔴 Da controllare"
          }
          onClear={() => setFreshnessFilter(null)}
        />
      )}

      {!freshnessFilter && view === "category" && selectedCategory && (
        <FilterChip
          label={`${getCategoryMeta(selectedCategory).emoji} ${
            getCategoryMeta(selectedCategory).label
          }`}
          onClear={() => setSelectedCategory(null)}
        />
      )}

      {showCategoryGrid ? (
        <CategoryGrid summary={summary} onSelect={setSelectedCategory} />
      ) : (
        <>
          {!freshnessFilter && view === "expiry" && (
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
              <ProductList products={visible} sort={sort} onConsumed={handleConsumed} />
              <InstallCard />
            </>
          )}
        </>
      )}

      <AddFab />
    </div>
  );
}

function Hero({ total }: { total: number }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-foreground">🧊 Il mio congelatore</h1>
      <p className="text-muted">
        {total} {total === 1 ? "prodotto" : "prodotti"}
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
