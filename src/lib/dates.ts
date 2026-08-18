// Logica del "semaforo" delle scadenze: il pezzo più importante dell'app.
// Tutta la UI si appoggia a queste funzioni per decidere colore e testo,
// così la regola resta unica e coerente ovunque.

export type FreshnessLevel = "green" | "orange" | "red" | "none";

export interface FreshnessInfo {
  level: FreshnessLevel;
  /** Testo pronto per la UI, es. "Consumo consigliato tra 5 giorni". */
  label: string;
  /** Numero di giorni alla data (negativo se già superata). Null se non c'è data. */
  daysLeft: number | null;
}

// Soglie configurabili (punto 25 della specifica).
export const FRESHNESS_THRESHOLDS = {
  orangeWithinDays: 14, // 🟠 da 1 a 14 giorni
  // 🔴 0 giorni o data superata
  // 🟢 oltre 14 giorni
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Calcola lo stato "semaforo" di un prodotto a partire dalla data più
 * affidabile disponibile: preferiamo la vera scadenza, altrimenti usiamo
 * la data di consumo consigliato (stimata).
 */
export function getFreshness(
  params: { expiryDate: Date | null; recommendedConsumptionDate: Date | null },
  today: Date = new Date()
): FreshnessInfo {
  const referenceDate = params.expiryDate ?? params.recommendedConsumptionDate;
  const isEstimate = !params.expiryDate && !!params.recommendedConsumptionDate;

  if (!referenceDate) {
    return { level: "none", label: "Nessuna data indicata", daysLeft: null };
  }

  const daysLeft = daysBetween(today, referenceDate);
  const verb = isEstimate ? "Consumo consigliato" : "Scade";

  if (daysLeft < 0) {
    return {
      level: "red",
      label: isEstimate ? "Consumo consigliato superato" : "Data superata",
      daysLeft,
    };
  }
  if (daysLeft === 0) {
    return { level: "red", label: "Consuma oggi", daysLeft };
  }
  if (daysLeft <= FRESHNESS_THRESHOLDS.orangeWithinDays) {
    const giorni = daysLeft === 1 ? "domani" : `tra ${daysLeft} giorni`;
    return { level: "orange", label: `${verb} ${giorni}`, daysLeft };
  }
  return { level: "green", label: `${verb} tra ${daysLeft} giorni`, daysLeft };
}

export function formatDateIt(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Etichetta breve per i colori, usata su badge molto compatti. */
export const FRESHNESS_META: Record<
  FreshnessLevel,
  { dot: string; bg: string; text: string; border: string; emoji: string }
> = {
  green: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    emoji: "🟢",
  },
  orange: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    emoji: "🟠",
  },
  red: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    emoji: "🔴",
  },
  none: {
    dot: "bg-neutral-300",
    bg: "bg-neutral-50",
    text: "text-neutral-500",
    border: "border-neutral-200",
    emoji: "⚪",
  },
};
