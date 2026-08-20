// Scorciatoie condivise dai campi data del form, del wizard e della revisione
// import: evita di ripetere la stessa manciata di righe in tre posti.
export function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoInputValue(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
