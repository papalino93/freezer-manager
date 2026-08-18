"use client";

import { CATEGORIES } from "@/lib/categories";
import type { SummaryDTO } from "@/lib/types";

export function CategoryGrid({
  summary,
  onSelect,
}: {
  summary: SummaryDTO;
  onSelect: (category: string) => void;
}) {
  const counts = new Map(summary.byCategory.map((c) => [c.category, c.count]));

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CATEGORIES.map((cat) => {
        const count = counts.get(cat.value) ?? 0;
        return (
          <li key={cat.value}>
            <button
              type="button"
              onClick={() => onSelect(cat.value)}
              disabled={count === 0}
              className="tap-target flex w-full flex-col items-center gap-1 rounded-2xl border border-border bg-surface px-3 py-4 text-center shadow-sm transition-shadow hover:shadow-md disabled:opacity-40 disabled:hover:shadow-sm"
            >
              <span className="text-3xl" aria-hidden>
                {cat.emoji}
              </span>
              <span className="text-sm font-bold text-foreground">{cat.label}</span>
              <span className="text-xs font-semibold text-muted">
                {count} {count === 1 ? "prodotto" : "prodotti"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
