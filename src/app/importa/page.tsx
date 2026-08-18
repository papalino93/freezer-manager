"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoCapture } from "@/components/PhotoCapture";
import { ImportItemRow } from "@/components/ImportItemRow";
import { parsedItemToImportItem, type ImportItem } from "@/lib/import-item";

type Status = "idle" | "loading" | "error" | "review" | "importing";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export const dynamic = "force-dynamic";

export default function ImportaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoEstimate, setAutoEstimate] = useState(true);
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);
  const [freezerId, setFreezerId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setFreezers(data.freezers);
        if (data.freezers.length === 1) setFreezerId(data.freezers[0].id);
      })
      .catch(() => {});
  }, []);

  async function handlePhoto(dataUrl: string) {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/ai/parse-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Non riesco a leggere bene il foglio.");
        setStatus("error");
        return;
      }
      const parsedItems = data.result.items.map(parsedItemToImportItem);
      if (parsedItems.length === 0) {
        setErrorMessage(
          "Non ho trovato prodotti leggibili in questa foto. Prova con più luce e più vicino al foglio."
        );
        setStatus("error");
        return;
      }
      setItems(parsedItems);
      setStatus("review");
    } catch {
      setErrorMessage("Non riesco a leggere bene il foglio. Riprova.");
      setStatus("error");
    }
  }

  function updateItem(index: number, next: ImportItem) {
    setItems((prev) => prev.map((it, i) => (i === index ? next : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImport() {
    if (!freezerId) return;
    setStatus("importing");
    const payload = {
      freezerId,
      items: items.map((it) => ({
        name: it.name,
        category: it.category,
        quantity: it.quantity || null,
        purchaseDate: it.purchaseDate || null,
        frozenDate: it.frozenDate || null,
        expiryDate: it.expiryDate || null,
        autoEstimate,
      })),
    };
    const res = await fetch("/api/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setErrorMessage("Qualcosa è andato storto durante l'importazione. Riprova.");
      setStatus("review");
    }
  }

  if (status === "review" || status === "importing") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Ho trovato {items.length} {items.length === 1 ? "prodotto" : "prodotti"}
          </h1>
          <p className="mt-1 text-muted">
            Controlla e correggi quello che serve prima di importare. I campi con il bordo
            arancione erano poco leggibili.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={autoEstimate}
            onChange={(e) => setAutoEstimate(e.target.checked)}
            className="tap-target mt-0.5 h-5 w-5 accent-brand"
          />
          <span>
            Per i prodotti senza scadenza, stima un consumo consigliato dalla data di
            congelamento.
            <br />
            <span className="text-muted">ℹ️ Sarà sempre indicata come stima.</span>
          </span>
        </label>

        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <ImportItemRow
              key={item.key}
              item={item}
              onChange={(next) => updateItem(index, next)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </ul>

        {items.length === 0 && (
          <p className="rounded-2xl bg-surface px-4 py-6 text-center text-muted">
            Nessun prodotto da importare: hai rimosso tutte le righe.
          </p>
        )}

        {errorMessage && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          disabled={items.length === 0 || status === "importing" || !freezerId}
          onClick={handleImport}
          className="tap-target sticky bottom-4 rounded-full bg-brand px-5 py-4 text-lg font-extrabold text-white shadow-lg hover:bg-brand-dark disabled:opacity-60"
        >
          {status === "importing" ? "Importazione…" : `✓ Importa ${items.length} prodotti`}
        </button>
      </div>
    );
  }

  if (freezers && freezers.length > 1 && !freezerId) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">📋 Importa lista esistente</h1>
          <p className="mt-1 text-muted">Dove stai importando questi prodotti?</p>
        </div>
        <div className="flex flex-col gap-4">
          {freezers.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFreezerId(f.id)}
              className="tap-target flex items-center gap-3 rounded-3xl border border-border bg-surface px-5 py-6 text-xl font-extrabold text-foreground shadow-sm hover:shadow-md"
            >
              {f.role === "OWNER" ? "🧊" : "👥"} {f.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const freezerName = freezers?.find((f) => f.id === freezerId)?.name;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">📋 Importa lista esistente</h1>
        <p className="mt-1 text-muted">
          Fotografa il foglio su cui hai scritto cosa c&apos;è nel congelatore: proverò a
          ricostruire la lista automaticamente.
          {freezerName && (
            <>
              {" "}
              Sto importando in <strong>{freezerName}</strong>.
            </>
          )}
        </p>
      </div>

      <PhotoCapture label="Fotografa il foglio" onPhoto={handlePhoto} />

      {status === "loading" && (
        <p className="text-center font-semibold text-muted">Sto leggendo il foglio…</p>
      )}

      {status === "error" && errorMessage && (
        <p className="rounded-2xl bg-rose-50 px-4 py-4 text-center font-semibold text-rose-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
