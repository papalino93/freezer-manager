"use client";

import { useEffect, useState } from "react";
import { getCategoryMeta } from "@/lib/categories";
import { formatDateIt } from "@/lib/dates";
import type { ProductDTO } from "@/lib/types";

export default function StoricoPage() {
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setError(false);
      try {
        const res = await fetch("/api/products?status=consumed&sort=recent");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!ignore) setProducts(data.products);
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
      setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">🕘 Storico</h1>
        <p className="mt-1 text-muted">I prodotti che hai segnato come consumati.</p>
      </div>

      {error && <p className="text-center text-muted">Qualcosa è andato storto. Riprova.</p>}

      {!error && !products && <p className="text-center text-muted">Caricamento…</p>}

      {products && products.length === 0 && (
        <p className="rounded-2xl bg-surface px-4 py-8 text-center text-muted">
          Non hai ancora consumato nessun prodotto.
        </p>
      )}

      {products && products.length > 0 && (
        <ul className="flex flex-col gap-2">
          {products.map((p) => {
            const category = getCategoryMeta(p.category);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
              >
                <span className="text-2xl" aria-hidden>
                  {category.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted">
                    {category.label} · aggiunto il {formatDateIt(new Date(p.createdAt))}
                    {p.consumedAt && ` · consumato il ${formatDateIt(new Date(p.consumedAt))}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => undoConsume(p.id)}
                  className="tap-target shrink-0 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted hover:bg-background hover:text-foreground"
                >
                  Annulla
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
