"use client";

import type { SummaryDTO } from "@/lib/types";

export function AlertSummary({
  summary,
  activeFilter,
  onFilterChange,
}: {
  summary: SummaryDTO;
  activeFilter: "orange" | "red" | null;
  onFilterChange: (filter: "orange" | "red" | null) => void;
}) {
  if (summary.orange === 0 && summary.red === 0) {
    return (
      <p className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-brand-dark">
        🙂 Tutto tranquillo: niente da consumare con urgenza.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {summary.red > 0 && (
        <button
          type="button"
          onClick={() => onFilterChange(activeFilter === "red" ? null : "red")}
          aria-pressed={activeFilter === "red"}
          className={`tap-target flex-1 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
            activeFilter === "red"
              ? "border-rose-400 bg-rose-100 text-rose-800"
              : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          🔴 {summary.red} {summary.red === 1 ? "prodotto" : "prodotti"} da controllare
        </button>
      )}
      {summary.orange > 0 && (
        <button
          type="button"
          onClick={() => onFilterChange(activeFilter === "orange" ? null : "orange")}
          aria-pressed={activeFilter === "orange"}
          className={`tap-target flex-1 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-colors ${
            activeFilter === "orange"
              ? "border-amber-400 bg-amber-100 text-amber-900"
              : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
          }`}
        >
          🟠 {summary.orange} {summary.orange === 1 ? "prodotto" : "prodotti"} da consumare presto
        </button>
      )}
    </div>
  );
}
