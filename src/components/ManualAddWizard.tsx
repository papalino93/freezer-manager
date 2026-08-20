"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryPicker } from "@/components/CategoryPicker";
import { confirmDiscardUnsavedChanges, useUnsavedChangesGuard } from "@/hooks/useUnsavedChanges";
import type { ProductFormValues } from "@/lib/form-values";
import { todayInputValue, daysAgoInputValue } from "@/lib/quick-dates";

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

// Passi senza un campo con autoFocus proprio: qui spostiamo il focus sul
// titolo quando si cambia passo, altrimenti resterebbe "nel vuoto" (punto
// audit #6). I tre passi data hanno ora l'autoFocus sul proprio input (più
// diretto per chi vuole solo digitare la data e premere Tab/Invio), quindi
// non serve più includerli qui.
const FOCUS_HEADING_STEPS = new Set<(typeof STEPS)[number]>(["category"]);

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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useUnsavedChangesGuard(JSON.stringify(values) !== JSON.stringify(initialValues));

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (FOCUS_HEADING_STEPS.has(step)) headingRef.current?.focus();
  }, [step]);

  function goNext() {
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }
  function goBack() {
    if (stepIndex === 0) {
      // Stesso avviso del pulsante "Indietro" dell'header, che qui non
      // verrebbe attraversato (punto audit #1): uscire dal primo passo
      // scarta tutto quello scritto finora.
      if (!confirmDiscardUnsavedChanges()) return;
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

  // Un unico <form>: Invio da tastiera (o "Vai" su mobile) avanza il passo
  // corrente esattamente come toccare il pulsante (punto audit #5).
  function handleStepSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "name") {
      if (!values.name.trim()) return;
      goNext();
    } else if (isLastStep) {
      handleFinalSave();
    } else {
      goNext();
    }
  }

  const hasExpiry = values.expiryDate.trim().length > 0;

  return (
    <form onSubmit={handleStepSubmit} className="flex flex-col gap-6">
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
        <Step title="Cosa hai messo nel congelatore?" headingRef={headingRef}>
          <input
            type="text"
            autoFocus
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Es. Polpette, Lasagne, Pane..."
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground placeholder:text-muted focus:border-brand"
          />
          <PrimaryButton type="submit" disabled={!values.name.trim()}>
            Continua
          </PrimaryButton>
        </Step>
      )}

      {step === "category" && (
        <Step title="Che tipo di alimento è?" headingRef={headingRef}>
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
        <Step title="Quando l'hai comprato?" hint="Facoltativo" headingRef={headingRef}>
          <DateStep value={values.purchaseDate} onChange={(v) => set("purchaseDate", v)} showYesterday />
          <PrimaryButton type="submit">Continua</PrimaryButton>
        </Step>
      )}

      {step === "frozenDate" && (
        <Step title="Quando l'hai congelato?" headingRef={headingRef}>
          <DateStep value={values.frozenDate} onChange={(v) => set("frozenDate", v)} showYesterday />
          <PrimaryButton type="submit">Continua</PrimaryButton>
        </Step>
      )}

      {step === "expiryDate" && (
        <Step title="Quando scade?" hint="Facoltativo" headingRef={headingRef}>
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
          <PrimaryButton type="submit">Continua</PrimaryButton>
        </Step>
      )}

      {step === "quantity" && (
        <Step title="Quanto ne hai?" hint="Facoltativo" headingRef={headingRef}>
          <input
            type="text"
            autoFocus
            value={values.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            placeholder="Es. 4 pezzi, 1 kg, 2 confezioni..."
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground placeholder:text-muted focus:border-brand"
          />
          <PrimaryButton type="submit">Continua</PrimaryButton>
        </Step>
      )}

      {step === "brand" && (
        <Step title="Che marca è?" hint="Facoltativo" headingRef={headingRef}>
          <input
            type="text"
            autoFocus
            value={values.brand}
            onChange={(e) => set("brand", e.target.value)}
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-lg text-foreground focus:border-brand"
          />
          <PrimaryButton type="submit">Continua</PrimaryButton>
        </Step>
      )}

      {step === "notes" && (
        <Step title="Vuoi aggiungere una nota?" hint="Facoltativo" headingRef={headingRef}>
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
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Salvataggio…" : "✓ Salva nel congelatore"}
          </PrimaryButton>
        </Step>
      )}

      {!isLastStep && step !== "category" && (
        <p className="text-center text-xs text-muted">Puoi anche lasciare vuoto e continuare.</p>
      )}
    </form>
  );
}

function Step({
  title,
  hint,
  headingRef,
  children,
}: {
  title: string;
  hint?: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold text-foreground outline-none">
          {title}
        </h1>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  type,
  disabled,
}: {
  children: React.ReactNode;
  type: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="tap-target rounded-full bg-brand px-5 py-4 text-lg font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function DateStep({
  value,
  onChange,
  showYesterday,
}: {
  value: string;
  onChange: (v: string) => void;
  /** "Ieri" ha senso per acquisto/congelamento, non per una scadenza. */
  showYesterday?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input
        type="date"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tap-target w-full rounded-xl border border-border bg-surface px-3 py-3 text-lg text-foreground focus:border-brand"
      />
      {/* tabIndex={-1}: dopo aver digitato la data, Tab (o Invio dal form)
          deve andare dritto su "Continua", non fermarsi su queste
          scorciatoie pensate per il tocco (punto segnalato dall'utente). */}
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
