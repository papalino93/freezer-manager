"use client";

import { useState } from "react";
import { CategoryPicker } from "@/components/CategoryPicker";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChanges";
import type { ProductFormValues } from "@/lib/form-values";

const STEPS = [
  "name",
  "category",
  "purchaseDate",
  "frozenDate",
  "expiryDate",
  "quantity",
  "brand",
  "notes",
] as const;

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Una domanda alla volta, come la scelta del congelatore: più semplice da
 * seguire del form con tutti i campi insieme, soprattutto per chi non è a
 * suo agio con gli schermi. Usato solo per l'inserimento manuale — la foto
 * con AI arriva già con i campi compilati tutti insieme (correggere, non
 * rispondere a domande), e la modifica di un prodotto esistente deve
 * mostrare tutto insieme per cambiare al volo un solo campo.
 */
export function ManualAddWizard({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<string | void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initialValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useUnsavedChangesGuard(JSON.stringify(values) !== JSON.stringify(initialValues));

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  function goNext() {
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }
  function goBack() {
    if (stepIndex === 0) {
      onCancel();
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function handleFinalSave() {
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="tap-target -ml-2 rounded-full px-3 py-2 text-sm font-bold text-muted hover:bg-surface"
        >
          {stepIndex > 0 ? "← Indietro" : "Annulla"}
        </button>
        <span className="text-sm text-muted">
          Passo {stepIndex + 1} di {STEPS.length}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {step === "name" && (
        <Step title="Cosa hai messo nel congelatore?">
          <input
            type="text"
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Es. Polpette, Lasagne, Pane..."
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground placeholder:text-muted focus:border-brand"
          />
          <PrimaryButton disabled={!values.name.trim()} onClick={goNext}>
            Continua
          </PrimaryButton>
        </Step>
      )}

      {step === "category" && (
        <Step title="Che tipo di alimento è?">
          <CategoryPicker
            value={values.category}
            onChange={(v) => {
              set("category", v);
              goNext();
            }}
          />
        </Step>
      )}

      {step === "purchaseDate" && (
        <Step title="Quando l'hai comprato?" hint="Facoltativo">
          <DateStep value={values.purchaseDate} onChange={(v) => set("purchaseDate", v)} />
          <PrimaryButton onClick={goNext}>Continua</PrimaryButton>
        </Step>
      )}

      {step === "frozenDate" && (
        <Step title="Quando l'hai congelato?">
          <DateStep value={values.frozenDate} onChange={(v) => set("frozenDate", v)} />
          <PrimaryButton onClick={goNext}>Continua</PrimaryButton>
        </Step>
      )}

      {step === "expiryDate" && (
        <Step title="Quando scade?" hint="Facoltativo">
          <DateStep value={values.expiryDate} onChange={(v) => set("expiryDate", v)} />
          {!hasExpiry && (
            <label className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={values.autoEstimate}
                onChange={(e) => set("autoEstimate", e.target.checked)}
                className="tap-target mt-0.5 h-5 w-5 accent-brand"
              />
              <span>
                Se non conosci la scadenza, stima automaticamente un consumo consigliato in base
                alla data di congelamento e alla categoria.
                <br />
                <span className="text-muted">
                  ℹ️ Sarà sempre indicata come stima, mai come una vera scadenza.
                </span>
              </span>
            </label>
          )}
          <PrimaryButton onClick={goNext}>Continua</PrimaryButton>
        </Step>
      )}

      {step === "quantity" && (
        <Step title="Quanto ne hai?" hint="Facoltativo">
          <input
            type="text"
            autoFocus
            value={values.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="Es. 4 pezzi, 1 kg, 2 confezioni..."
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground placeholder:text-muted focus:border-brand"
          />
          <PrimaryButton onClick={goNext}>Continua</PrimaryButton>
        </Step>
      )}

      {step === "brand" && (
        <Step title="Che marca è?" hint="Facoltativo">
          <input
            type="text"
            autoFocus
            value={values.brand}
            onChange={(e) => set("brand", e.target.value)}
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground focus:border-brand"
          />
          <PrimaryButton onClick={goNext}>Continua</PrimaryButton>
        </Step>
      )}

      {step === "notes" && (
        <Step title="Vuoi aggiungere una nota?" hint="Facoltativo">
          <textarea
            autoFocus
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            placeholder="Es. porzione già condita, marinata al limone..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground placeholder:text-muted focus:border-brand"
          />
          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}
          <PrimaryButton disabled={submitting} onClick={handleFinalSave}>
            {submitting ? "Salvataggio…" : "✓ Salva nel congelatore"}
          </PrimaryButton>
        </Step>
      )}

      {!isLastStep && step !== "category" && (
        <p className="text-center text-xs text-muted">Puoi anche lasciare vuoto e continuare.</p>
      )}
    </div>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="tap-target rounded-full bg-brand px-5 py-4 text-lg font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function DateStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tap-target w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg text-foreground focus:border-brand"
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
