"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { getCategoryMeta } from "@/lib/categories";
import { FRESHNESS_META } from "@/lib/dates";
import { getDateLine, getFrozenLine } from "@/lib/format";
import { productToFormValues, formValuesToPayload } from "@/lib/form-values";
import { parseCountableQuantity, formatCountableQuantity } from "@/lib/countable-quantity";

export function ProductCard({
  product,
  onConsumed,
  onQuantityChanged,
}: {
  product: ProductDTO;
  onConsumed?: (id: string) => void;
  /** Chiamato quando si consuma solo un'unità (il prodotto resta attivo,
   * cambia solo la quantità residua): il chiamante deve aggiornarla nella
   * lista senza rimuovere la card. */
  onQuantityChanged?: (id: string, quantity: string | null) => void;
}) {
  const [confirming, setConfirming] = useState<"one" | "all" | null>(null);
  const [loading, setLoading] = useState(false);
  const category = getCategoryMeta(product.category);
  const freshness = FRESHNESS_META[product.freshness.level];
  const dateLine = getDateLine(product);
  const frozenLine = getFrozenLine(product);
  const isEstimate = product.dateSource === "ESTIMATED";
  // "5 scatole", "3 confezioni"... permette di consumarne una alla volta
  // invece di dover per forza chiudere tutto il prodotto in un colpo solo.
  // Non scatta per quantità di peso/volume ("1 kg"): lì non ha senso.
  const countable = parseCountableQuantity(product.quantity);

  async function handleConsumeAll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/consume`, { method: "POST" });
      if (res.ok) {
        onConsumed?.(product.id);
      }
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  }

  async function handleConsumeOne() {
    if (!countable) return;
    setLoading(true);
    try {
      const nextQuantity = formatCountableQuantity({ ...countable, count: countable.count - 1 });
      const payload = { ...formValuesToPayload(productToFormValues(product)), quantity: nextQuantity };
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onQuantityChanged?.(product.id, nextQuantity);
      }
    } finally {
      setLoading(false);
      setConfirming(null);
    }
  }

  return (
    <li
      className={`relative rounded-2xl border ${freshness.border} ${freshness.bg} p-4 shadow-sm transition-shadow hover:shadow-md`}
    >
      {product.freezerName && (
        <span className="absolute right-3 top-3 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted shadow-sm">
          📍 {product.freezerName}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5" aria-hidden>
          <span className="text-2xl leading-none">{category.emoji}</span>
          <span className={`h-2.5 w-2.5 rounded-full ${freshness.dot}`} />
        </div>

        <div className="min-w-0 flex-1">
          <Link href={`/prodotto/${product.id}/modifica`} className="block">
            <h3 className="truncate pr-20 text-lg font-bold text-foreground">{product.name}</h3>
            {product.brand && <p className="truncate text-sm text-muted">{product.brand}</p>}
            {frozenLine && <p className="mt-1 text-sm text-muted">{frozenLine}</p>}
            <p className={`mt-0.5 text-sm font-semibold ${freshness.text}`}>
              {freshness.emoji} {dateLine}
            </p>
            {isEstimate && (
              <p className="mt-0.5 text-xs text-muted">
                ℹ️ Data stimata in base ai tempi consigliati di conservazione in congelatore.
              </p>
            )}
            {product.quantity && (
              <p className="mt-1 text-sm text-muted">📦 {product.quantity}</p>
            )}
            {product.notes && (
              <p className="mt-0.5 text-sm italic text-muted">📝 {product.notes}</p>
            )}
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {confirming === null ? (
              <>
                <button
                  type="button"
                  onClick={() => setConfirming(countable ? "one" : "all")}
                  className="tap-target rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
                >
                  {countable ? `➖ Consumane 1 (di ${countable.count})` : "✓ Consumato"}
                </button>
                {countable && (
                  <button
                    type="button"
                    onClick={() => setConfirming("all")}
                    className="tap-target text-sm font-semibold text-muted hover:text-foreground hover:underline"
                  >
                    Ho finito tutte
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2">
                <span className="text-sm font-semibold text-foreground">
                  {confirming === "one" ? "Confermi che ne hai usata una?" : "Confermi che le hai finite tutte?"}
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={confirming === "one" ? handleConsumeOne : handleConsumeAll}
                  className="tap-target rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {confirming === "one" ? "✓ Sì" : "✓ Sì, tutte"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirming(null)}
                  className="tap-target rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted"
                >
                  Annulla
                </button>
              </div>
            )}
            <Link
              href={`/prodotto/${product.id}/modifica`}
              className="tap-target ml-auto flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground"
            >
              ✏️ Modifica
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
