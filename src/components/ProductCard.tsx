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
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [picking, setPicking] = useState(false);
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const category = getCategoryMeta(product.category);
  const freshness = FRESHNESS_META[product.freshness.level];
  const dateLine = getDateLine(product);
  const frozenLine = getFrozenLine(product);
  const isEstimate = product.dateSource === "ESTIMATED";
  // Marca, congelamento e quantità su un'unica riga secondaria invece di
  // tre righe impilate: una card con tutti i campi compilati arrivava a
  // 7-8 righe di testo, troppe per scorrere veloce (punto segnalato
  // dall'utente).
  const metaLine = [product.brand, frozenLine, product.quantity ? `📦 ${product.quantity}` : null]
    .filter(Boolean)
    .join(" · ");
  // "5 scatole", "3 confezioni"... permette di consumarne solo alcune
  // invece di dover per forza chiudere tutto il prodotto in un colpo solo.
  // Non scatta per quantità di peso/volume ("1 kg"): lì non ha senso.
  const countable = parseCountableQuantity(product.quantity);

  function openPicker() {
    setAmount(1);
    setPicking(true);
  }

  async function handleConsumeAll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/consume`, { method: "POST" });
      if (res.ok) {
        onConsumed?.(product.id);
      }
    } finally {
      setLoading(false);
      setConfirmingAll(false);
      setPicking(false);
    }
  }

  async function handleConsumeAmount() {
    if (!countable) return;
    // Consumarle tutte con lo stepper equivale a "Ho finito tutte": stessa
    // strada di chi non ha una quantità a unità separate, il prodotto
    // sparisce dalla lista invece di restare con "0 scatole".
    if (amount >= countable.count) {
      await handleConsumeAll();
      return;
    }
    setLoading(true);
    try {
      const nextQuantity = formatCountableQuantity({ ...countable, count: countable.count - amount });
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
      setPicking(false);
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
            <p className={`mt-0.5 text-sm font-semibold ${freshness.text}`}>
              {freshness.emoji} {dateLine}
            </p>
            {metaLine && <p className="mt-1 truncate text-xs text-muted">{metaLine}</p>}
            {isEstimate && (
              <p className="mt-0.5 text-xs text-muted">
                ℹ️ Data stimata in base ai tempi consigliati di conservazione in congelatore.
              </p>
            )}
            {product.notes && (
              <p className="mt-0.5 text-xs italic text-muted">📝 {product.notes}</p>
            )}
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {picking && countable ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2">
                <span className="text-sm font-semibold text-foreground">Quante ne consumi?</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={loading || amount <= 1}
                    onClick={() => setAmount((a) => Math.max(1, a - 1))}
                    aria-label="Diminuisci"
                    className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-lg font-bold text-foreground disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-base font-extrabold text-foreground">
                    {amount}
                  </span>
                  <button
                    type="button"
                    disabled={loading || amount >= countable.count}
                    onClick={() => setAmount((a) => Math.min(countable.count, a + 1))}
                    aria-label="Aumenta"
                    className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-lg font-bold text-foreground disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConsumeAmount}
                  className="tap-target rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {amount >= countable.count ? "✓ Consuma tutte" : `✓ Consuma ${amount}`}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPicking(false)}
                  className="tap-target rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted"
                >
                  Annulla
                </button>
              </div>
            ) : confirmingAll ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2">
                <span className="text-sm font-semibold text-foreground">Confermi?</span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConsumeAll}
                  className="tap-target rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  ✓ Sì, consumato
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmingAll(false)}
                  className="tap-target rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (countable ? openPicker() : setConfirmingAll(true))}
                className="tap-target rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
              >
                {countable ? `➖ Consuma (di ${countable.count})` : "✓ Consumato"}
              </button>
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
