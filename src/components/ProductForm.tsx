"use client";

import { useState } from "react";
import { CategoryPicker } from "@/components/CategoryPicker";
import type { ProductFormValues } from "@/lib/form-values";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChanges";
import { todayInputValue, daysAgoInputValue } from "@/lib/quick-dates";

export function ProductForm({
  initialValues,
  submitLabel,
  onSubmit,
  aiNotice,
  renderExtra,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  onSubmit: (values: ProductFormValues) => Promise<string | void>;
  /** Messaggio mostrato quando i dati arrivano da un riconoscimento AI (punto 32). */
  aiNotice?: string;
  /**
   * Azioni extra che devono vedere gli stessi valori del form (es.
   * "sposta in un altro congelatore"): renderizzate qui dentro, non a
   * fianco del form, perché i valori vivono solo in questo stato locale —
   * un pulsante esterno userebbe sempre gli ultimi dati salvati, non
   * quelli appena digitati e non ancora confermati.
   */
  renderExtra?: (values: ProductFormValues, disabled: boolean) => React.ReactNode;
}) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avvisa prima di uscire se l'utente ha già scritto qualcosa di diverso
  // da quello con cui il form è partito (punto audit #3).
  useUnsavedChangesGuard(JSON.stringify(values) !== JSON.stringify(initialValues));

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
          showYesterday
        />
        <DateField
          label="Data di congelamento"
          value={values.frozenDate}
          onChange={(v) => set("frozenDate", v)}
          showYesterday
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

      {renderExtra?.(values, submitting)}
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
  showYesterday,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** "Ieri" ha senso per acquisto/congelamento, non per una scadenza. */
  showYesterday?: boolean;
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
      {/* tabIndex={-1}: scorciatoie comode al tocco, ma che con Tab da
          tastiera non devono intromettersi tra un campo data e il
          successivo — si digita direttamente nell'input, che resta
          l'unica tappa "vera" del tab (punto segnalato dall'utente). */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange(todayInputValue())}
          className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface"
        >
          Oggi
        </button>
        {showYesterday && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(daysAgoInputValue(1))}
            className="tap-target rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:bg-surface"
          >
            Ieri
          </button>
        )}
        {value && (
          <button
            type="button"
            tabIndex={-1}
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
