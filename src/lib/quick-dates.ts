// Scorciatoie condivise dai campi data del form, del wizard e della revisione
// import: evita di ripetere la stessa manciata di righe in tre posti.

/**
 * Data di calendario LOCALE (quella che l'utente vede sull'orologio), non
 * quella UTC: usare toISOString() qui sbaglierebbe di un giorno per chi è
 * in un fuso avanti rispetto a UTC (es. l'Italia) nelle prime ore del
 * mattino — "Oggi" alle 00:30 locali inserirebbe la data di ieri, perché a
 * quell'ora in UTC è ancora il giorno prima.
 */
function toDateOnlyValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayInputValue(): string {
  return toDateOnlyValue(new Date());
}

export function daysAgoInputValue(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateOnlyValue(d);
}
