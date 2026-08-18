"use client";

export type ViewMode = "expiry" | "category";

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Vista"
      className="flex gap-1 rounded-full border border-border bg-surface p-1"
    >
      <button
        role="tab"
        aria-selected={value === "expiry"}
        onClick={() => onChange("expiry")}
        className={`tap-target flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
          value === "expiry" ? "bg-brand text-white" : "text-muted hover:text-foreground"
        }`}
      >
        📅 Scadenza
      </button>
      <button
        role="tab"
        aria-selected={value === "category"}
        onClick={() => onChange("category")}
        className={`tap-target flex-1 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
          value === "category" ? "bg-brand text-white" : "text-muted hover:text-foreground"
        }`}
      >
        🗂️ Categoria
      </button>
    </div>
  );
}
