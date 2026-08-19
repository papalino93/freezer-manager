"use client";

import { CATEGORY_GROUPS } from "@/lib/categories";
import { FRESHNESS_META } from "@/lib/dates";
import type { SummaryDTO } from "@/lib/types";

export function CategoryGrid({
  summary,
  onSelect,
}: {
  summary: SummaryDTO;
  onSelect: (category: string) => void;
}) {
  const byCategory = new Map(summary.byCategory.map((c) => [c.category, c]));

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CATEGORY_GROUPS.map((group) => {
        const entry = byCategory.get(group.key);
        const count = entry?.count ?? 0;
        return (
          <li key={group.key}>
            <button
              type="button"
              onClick={() => onSelect(group.key)}
              disabled={count === 0}
              className="tap-target relative flex w-full flex-col items-center gap-1 rounded-2xl border border-border bg-surface px-3 py-4 text-center shadow-sm transition-shadow hover:shadow-md disabled:opacity-40 disabled:hover:shadow-sm"
            >
              {entry && entry.worstFreshness !== "none" && (
                <span
                  aria-hidden
                  className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${FRESHNESS_META[entry.worstFreshness].dot}`}
                />
              )}
              <span className="text-3xl" aria-hidden>
                {group.emoji}
              </span>
              <span className="text-sm font-bold text-foreground">{group.label}</span>
              <span className="text-xs font-semibold text-muted">
                {count} {count === 1 ? "prodotto" : "prodotti"}
                {entry && entry.worstFreshness !== "none" && entry.worstFreshness !== "green" && (
                  <>
                    {" · "}
                    {entry.worstFreshness === "red"
                      ? `${entry.worstCount} da controllare`
                      : `${entry.worstCount} da consumare presto`}
                  </>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
