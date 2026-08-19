import type { Category } from "@/generated/prisma/client";

/**
 * Durate consigliate di conservazione in congelatore, per categoria.
 * Punto di riferimento: linee guida USDA FoodSafety.gov "Freezer Storage
 * Chart" (cibi congelati a -18°C restano sicuri indefinitamente, ma perdono
 * qualità: queste sono le durate consigliate per la qualità, non limiti di
 * sicurezza).
 *
 * Questa tabella è la base sia per la stima automatica quando manca una
 * data di scadenza reale, sia per dare all'AI un riferimento sensato da
 * usare invece di inventare un numero a caso (vedi punto 22 e 53 della
 * specifica: mai una stima senza una fonte).
 */
export const STORAGE_GUIDE: Record<Category, { months: number; reason: string }> = {
  CARNE: {
    months: 4,
    reason: "carne macinata/cotta congelata: qualità ottimale entro 3-4 mesi",
  },
  PESCE: {
    months: 3,
    reason: "pesce congelato: qualità ottimale entro 3-4 mesi",
  },
  VERDURE: {
    months: 10,
    reason: "verdure congelate: qualità ottimale entro 8-12 mesi",
  },
  PIATTI_PRONTI: {
    months: 3,
    reason: "piatti pronti/avanzi cotti congelati: qualità ottimale entro 2-3 mesi",
  },
  PIZZA: {
    months: 2,
    reason: "pizza congelata fatta in casa: qualità ottimale entro 1-2 mesi",
  },
  PANE: {
    months: 3,
    reason: "pane e prodotti da forno congelati: qualità ottimale entro 2-3 mesi",
  },
  DOLCI: {
    months: 3,
    reason: "dolci fatti in casa congelati: qualità ottimale entro 2-3 mesi",
  },
  GELATI: {
    months: 2,
    reason: "gelato/dessert congelato: qualità ottimale entro 1-2 mesi",
  },
  LATTICINI: {
    months: 2,
    reason: "latticini congelati: qualità ottimale entro 1-2 mesi",
  },
  SUGHI: {
    months: 3,
    reason: "sughi e preparazioni congelate: qualità ottimale entro 2-3 mesi",
  },
  ALTRO: {
    months: 6,
    reason: "durata prudenziale generica per alimenti congelati",
  },
};

export const STORAGE_GUIDE_SOURCE =
  "Linee guida USDA FoodSafety.gov – Freezer Storage Chart (durate indicative per la qualità)";

/**
 * Calcola una data di consumo consigliato a partire dalla data di
 * congelamento (o, in mancanza, dalla data odierna) e dalla categoria.
 * Non viene mai chiamata se non abbiamo almeno una data di partenza
 * ragionevole: nessuna invenzione, solo un calcolo su una base nota.
 */
export function estimateConsumptionDate(
  category: Category,
  frozenDate: Date
): { date: Date; reason: string; source: string } {
  const guide = STORAGE_GUIDE[category];
  return { date: addMonthsClamped(frozenDate, guide.months), reason: guide.reason, source: STORAGE_GUIDE_SOURCE };
}

/**
 * A differenza di Date#setMonth, non "trabocca" nel mese successivo quando
 * il giorno di partenza non esiste nel mese di arrivo (es. 31 agosto + 6
 * mesi non deve diventare il 3 marzo): lo riporta all'ultimo giorno valido.
 */
function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, daysInTargetMonth));
  return result;
}
