"use client";

import { useState } from "react";
import { CategoryPicker } from "@/components/CategoryPicker";
import type { ProductFormValues } from "@/lib/form-values";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
  aiNotice,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<string | void>;
  /** Messaggio mostrato quando i dati arrivano da un riconoscimento AI (punto 32). */
  aiNotice?: string;
}) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Serve almeno un nome per il prodotto.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const message = await onSubmit(values);
      if (message) setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const hasExpiry = values.expiryDate.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {aiNotice && (
        <div className="rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand-dark">
          {aiNotice}
        </div>
      )}

      <Field label="Cosa hai messo nel congelatore?" htmlFor="name">
        <input
          id="name"
          type="text"
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Es. Polpette, Lasagne, Pane..."
          className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-brand"
        />
      </Field>

      <Field label="Marca (facoltativo)" htmlFor="brand">
        <input
          id="brand"
          type="text"
          value={values.brand}
          onChange={(e) => set("brand", e.target.value)}
          className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground focus:border-brand"
        />
      </Field>

      <Field label="Categoria">
        <CategoryPicker value={values.category} onChange={(v) => set("category", v)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <DateField
          label="Data di acquisto"
          value={values.purchaseDate}
          onChange={(v) => set("purchaseDate", v)}
        />
        <DateField
          label="Data di congelamento"
          value={values.frozenDate}
          onChange={(v) => set("frozenDate", v)}
        />
        <DateField
          label="Data di scadenza"
          value={values.expiryDate}
          onChange={(v) => set("expiryDate", v)}
        />
      </div>

      {!hasExpiry && (
        <label className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.autoEstimate}
            onChange={(e) => set("autoEstimate", e.target.checked)}
            className="tap-target mt-0.5 h-5 w-5 accent-brand"
          />
          <span>
            Se non conosci la scadenza, stima automaticamente un consumo consigliato in base alla
            data di congelamento e alla categoria.
            <br />
            <span className="text-muted">
              ℹ️ Sarà sempre indicata come stima, mai come una vera scadenza.
            </span>
          </span>
        </label>
      )}

      <Field label="Quantità (facoltativo)" htmlFor="quantity">
        <input
          id="quantity"
          type="text"
          value={values.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          placeholder="Es. 4 pezzi, 1 kg, 2 confezioni..."
          className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-brand"
        />
      </Field>

      <Field label="Note (facoltativo)" htmlFor="notes">
        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-brand"
        />
      </Field>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="tap-target rounded-full bg-brand px-5 py-4 text-lg font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Salvataggio…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tap-target w-full rounded-xl border border-border bg-surface px-3 py-3 text-base text-foreground focus:border-brand"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(todayInputValue())}
          className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface"
        >
          Oggi
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface"
          >
            Cancella
          </button>
        )}
      </div>
    </div>
  );
}
