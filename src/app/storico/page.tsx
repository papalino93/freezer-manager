"use client";

import { useEffect, useState } from "react";
import { getCategoryMeta } from "@/lib/categories";
import { formatDateIt } from "@/lib/dates";
import { formatCountableQuantity } from "@/lib/countable-quantity";
import type { ConsumptionLogDTO, ProductDTO } from "@/lib/types";

// Lo Storico è l'unione di due cose distinte:
// - prodotti consumati del tutto (status CONSUMED);
// - consumi PARZIALI (es. "1 scatola" su "5 scatole": il prodotto resta
//   ACTIVE e continua a comparire in home, ma quel consumo va comunque
//   registrato da qualche parte — bug segnalato dall'utente, prima
//   spariva nel nulla).
// Si mostrano insieme, ordinate per data, perché per chi guarda lo
// storico sono la stessa cosa: "cosa ho consumato e quando".
type HistoryEntry =
  | { kind: "product"; at: string; product: ProductDTO }
  | { kind: "consumption"; at: string; log: ConsumptionLogDTO };

export default function StoricoPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError(false);
      try {
        const [productsRes, logsRes] = await Promise.all([
          fetch("/api/products?status=consumed&sort=recent"),
          fetch("/api/consumption-logs"),
        ]);
        if (!productsRes.ok || !logsRes.ok) throw new Error();
        const productsData = await productsRes.json();
        const logsData = await logsRes.json();
        if (ignore) return;

        const products: ProductDTO[] = productsData.products;
        const logs: ConsumptionLogDTO[] = logsData.logs;
        const merged: HistoryEntry[] = [
          ...products.map((product): HistoryEntry => ({
            kind: "product",
            at: product.consumedAt ?? product.createdAt,
            product,
          })),
          ...logs.map((log): HistoryEntry => ({ kind: "consumption", at: log.consumedAt, log })),
        ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

        setEntries(merged);
      } catch {
        if (!ignore) setError(true);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  async function undoConsume(id: string) {
    const res = await fetch(`/api/products/${id}/consume`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) =>
        prev ? prev.filter((e) => !(e.kind === "product" && e.product.id === id)) : prev
      );
    }
  }

  async function undoPartial(logId: string) {
    const res = await fetch(`/api/consumption-logs/${logId}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) =>
        prev ? prev.filter((e) => !(e.kind === "consumption" && e.log.id === logId)) : prev
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">🕘 Storico</h1>
        <p className="mt-1 text-muted">I prodotti che hai segnato come consumati.</p>
      </div>

      {error && <p className="text-center text-muted">Qualcosa è andato storto. Riprova.</p>}

      {!error && !entries && <p className="text-center text-muted">Caricamento…</p>}

      {entries && entries.length === 0 && (
        <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
          Non hai ancora consumato nessun prodotto.
        </p>
      )}

      {entries && entries.length > 0 && (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) =>
            entry.kind === "product" ? (
              <ProductEntry key={`product-${entry.product.id}`} product={entry.product} onUndo={undoConsume} />
            ) : (
              <ConsumptionEntry key={`log-${entry.log.id}`} log={entry.log} onUndo={undoPartial} />
            )
          )}
        </ul>
      )}
    </div>
  );
}

function ProductEntry({ product, onUndo }: { product: ProductDTO; onUndo: (id: string) => void }) {
  const category = getCategoryMeta(product.category);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="text-2xl" aria-hidden>
        {category.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-foreground">{product.name}</p>
        <p className="text-xs text-muted">
          {category.label} · aggiunto il {formatDateIt(new Date(product.createdAt))}
          {product.consumedAt && ` · consumato il ${formatDateIt(new Date(product.consumedAt))}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onUndo(product.id)}
        className="tap-target shrink-0 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted hover:bg-background hover:text-foreground"
      >
        Annulla
      </button>
    </li>
  );
}

function ConsumptionEntry({
  log,
  onUndo,
}: {
  log: ConsumptionLogDTO;
  onUndo: (id: string) => void;
}) {
  const category = getCategoryMeta(log.category);
  const amountLabel = formatCountableQuantity({ count: log.amount, unitSingular: log.unit, rest: "" });
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="text-2xl" aria-hidden>
        {category.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-foreground">{log.name}</p>
        <p className="text-xs text-muted">
          {category.label} · {amountLabel} consumate il {formatDateIt(new Date(log.consumedAt))}
        </p>
      </div>
      {log.productId && (
        <button
          type="button"
          onClick={() => onUndo(log.id)}
          className="tap-target shrink-0 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted hover:bg-background hover:text-foreground"
        >
          Annulla
        </button>
      )}
    </li>
  );
}
