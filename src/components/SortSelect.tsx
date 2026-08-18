"use client";

import type { SortOption } from "@/lib/product-schema";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "expiry-asc", label: "📅 Scadenza più vicina" },
  { value: "expiry-desc", label: "📅 Scadenza più lontana" },
  { value: "recent", label: "🆕 Inseriti recentemente" },
  { value: "name", label: "🔤 Nome" },
];

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
      Ordina per
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="tap-target rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
