"use client";

import { CATEGORY_GROUPS, getCategoryGroupFor } from "@/lib/categories";
import type { CategoryValue } from "@/lib/types";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: CategoryValue;
  onChange: (v: CategoryValue) => void;
}) {
  const selectedGroupKey = getCategoryGroupFor(value).key;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {CATEGORY_GROUPS.map((group) => {
        const selected = selectedGroupKey === group.key;
        return (
          <button
            key={group.key}
            type="button"
            onClick={() => onChange(group.key)}
            aria-pressed={selected}
            className={`tap-target flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
              selected
                ? "border-brand bg-brand/10"
                : "border-border bg-surface hover:border-brand/50"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {group.emoji}
            </span>
            <span className="text-xs font-bold leading-tight text-foreground">{group.label}</span>
          </button>
        );
      })}
    </div>
  );
}
