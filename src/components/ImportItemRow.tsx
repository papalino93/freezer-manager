"use client";

import { CATEGORIES } from "@/lib/categories";
import type { ImportItem } from "@/lib/import-item";
import { describeUncertainFields } from "@/lib/import-item";
import type { CategoryValue } from "@/lib/types";

export function ImportItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: ImportItem;
  onChange: (item: ImportItem) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof ImportItem>(key: K, value: ImportItem[K]) {
    onChange({ ...item, [key]: value });
  }

  const uncertain = new Set(item.uncertainFields);

  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-2">
        <input
          type="text"
          value={item.name}
          onChange={(e) => set("name", e.target.value)}
          aria-label="Nome prodotto"
          className={`tap-target min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-base font-bold text-foreground ${
            uncertain.has("name") ? "border-amber-400" : "border-border"
          }`}
        />
        <select
          value={item.category}
          onChange={(e) => set("category", e.target.value as CategoryValue)}
          aria-label="Categoria"
          className="tap-target rounded-xl border border-border bg-background px-2 py-2 text-sm font-semibold text-foreground"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Rimuovi riga"
          className="tap-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background hover:text-rose-600"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniDate
          label="Acquisto"
          value={item.purchaseDate}
          uncertain={uncertain.has("purchaseDate")}
          onChange={(v) => set("purchaseDate", v)}
        />
        <MiniDate
          label="Congelato"
          value={item.frozenDate}
          uncertain={uncertain.has("frozenDate")}
          onChange={(v) => set("frozenDate", v)}
        />
        <MiniDate
          label="Scadenza"
          value={item.expiryDate}
          uncertain={uncertain.has("expiryDate")}
          onChange={(v) => set("expiryDate", v)}
        />
      </div>

      <input
        type="text"
        value={item.quantity}
        onChange={(e) => set("quantity", e.target.value)}
        placeholder="Quantità (facoltativo)"
        aria-label="Quantità"
        className="tap-target mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
      />

      {item.uncertainFields.length > 0 && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          ⚠️ {describeUncertainFields(item.uncertainFields)}
        </p>
      )}
      {item.rawText && (
        <p className="mt-1 truncate text-xs text-muted" title={item.rawText}>
          Dal foglio: «{item.rawText}»
        </p>
      )}
    </li>
  );
}

function MiniDate({
  label,
  value,
  uncertain,
  onChange,
}: {
  label: string;
  value: string;
  uncertain: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`tap-target w-full rounded-lg border bg-background px-1.5 py-1.5 text-xs text-foreground ${
          uncertain ? "border-amber-400" : "border-border"
        }`}
      />
    </label>
  );
}
