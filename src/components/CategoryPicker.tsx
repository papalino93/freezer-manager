"use client";

import { CATEGORIES } from "@/lib/categories";
import type { CategoryValue } from "@/lib/types";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: CategoryValue;
  onChange: (v: CategoryValue) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {CATEGORIES.map((cat) => {
        const selected = value === cat.value;
        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onChange(cat.value)}
            aria-pressed={selected}
            className={`tap-target flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
              selected
                ? "border-brand bg-brand/10"
                : "border-border bg-surface hover:border-brand/50"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {cat.emoji}
            </span>
            <span className="text-xs font-bold leading-tight text-foreground">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
