"use client";

import type { ProductDTO } from "@/lib/types";
import { getCategoryMeta } from "@/lib/categories";
import { FRESHNESS_META } from "@/lib/dates";
import { getDateLine } from "@/lib/format";

const MAX_PREVIEW = 3;

/**
 * Sostituisce le pillole "N da controllare / da consumare presto" con i
 * nomi veri dei prodotti più urgenti: si vede subito cosa scade prima senza
 * dover aprire nulla (dal mockup condiviso stasera).
 */
export function PriorityCard({
  products,
  onSeeAll,
}: {
  products: ProductDTO[];
  onSeeAll: () => void;
}) {
  const priority = products
    .filter((p) => p.freshness.level === "red" || p.freshness.level === "orange")
    .sort((a, b) => (a.freshness.daysLeft ?? Infinity) - (b.freshness.daysLeft ?? Infinity));

  if (priority.length === 0) {
    return (
      <p className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-brand-dark">
        🟢 Tutto tranquillo: nessun alimento da controllare a breve.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <h2 className="font-extrabold text-foreground">🔴 Da consumare prima</h2>
        <p className="mt-0.5 text-sm text-muted">
          {priority.length === 1
            ? "1 alimento ha una scadenza vicina."
            : `${priority.length} alimenti hanno una scadenza vicina.`}
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {priority.slice(0, MAX_PREVIEW).map((p) => {
          const category = getCategoryMeta(p.category);
          const freshness = FRESHNESS_META[p.freshness.level];
          return (
            <li key={p.id} className="flex items-center gap-2.5">
              <span className="text-xl" aria-hidden>
                {category.emoji}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-foreground">{p.name}</p>
                <p className={`text-sm font-semibold ${freshness.text}`}>{getDateLine(p)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {priority.length > MAX_PREVIEW && (
        <button
          type="button"
          onClick={onSeeAll}
          className="tap-target self-start text-sm font-bold text-brand hover:underline"
        >
          Vedi tutti ({priority.length}) →
        </button>
      )}
    </div>
  );
}
