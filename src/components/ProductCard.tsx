"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { getCategoryMeta } from "@/lib/categories";
import { FRESHNESS_META } from "@/lib/dates";
import { getDateLine, getFrozenLine } from "@/lib/format";

export function ProductCard({
  product,
  onConsumed,
}: {
  product: ProductDTO;
  onConsumed?: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const category = getCategoryMeta(product.category);
  const freshness = FRESHNESS_META[product.freshness.level];
  const dateLine = getDateLine(product);
  const frozenLine = getFrozenLine(product);
  const isEstimate = product.dateSource === "ESTIMATED";

  async function handleConsume() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/consume`, { method: "POST" });
      if (res.ok) {
        onConsumed?.(product.id);
      }
    } finally {
      setLoading(false);
      setConfirming(false);
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
              <p className="mt-1 text-sm text-muted">{product.quantity}</p>
            )}
          </Link>

          <div className="mt-3 flex items-center gap-2">
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="tap-target rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
              >
                ✓ Consumato
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2">
                <span className="text-sm font-semibold text-foreground">Confermi?</span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConsume}
                  className="tap-target rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  ✓ Sì, consumato
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirming(false)}
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
