// Riconosce quantità "a unità separate" scritte in modo naturale (es. "5
// scatole", "3 confezioni") per permettere di consumarne una alla volta,
// invece di dover per forza svuotare tutto il prodotto in un colpo solo
// (punto segnalato dall'utente: 5 scatole di pollo insieme devono poter
// essere consumate anche una per volta).
//
// Deliberatamente NON riconosce unità di peso/volume ("1 kg", "500 g"):
// lì "consumarne una" non ha senso, quindi quei prodotti continuano a
// funzionare esattamente come prima (un solo "Consumato" che chiude tutto).

const SINGULAR_OF: Record<string, string> = {
  pezzi: "pezzo",
  confezioni: "confezione",
  scatole: "scatola",
  porzioni: "porzione",
  fette: "fetta",
  vaschette: "vaschetta",
  bustine: "bustina",
  sacchetti: "sacchetto",
  barattoli: "barattolo",
};

const PLURAL_OF: Record<string, string> = Object.fromEntries(
  Object.entries(SINGULAR_OF).map(([plural, singular]) => [singular, plural])
);

export interface CountableQuantity {
  count: number;
  /** Parola al singolare da usare quando count torna a 1 ("" se il testo era un numero puro). */
  unitSingular: string;
  /** Qualsiasi cosa segua la parola riconosciuta (di solito vuoto). */
  rest: string;
}

/**
 * Riconosce la quantità solo se descrive almeno 2 unità separate — con 1
 * sola non c'è nulla da "consumare parzialmente", si applica il normale
 * "Consumato".
 */
export function parseCountableQuantity(quantity: string | null | undefined): CountableQuantity | null {
  if (!quantity) return null;
  const trimmed = quantity.trim();

  const bareNumber = trimmed.match(/^(\d+)$/);
  if (bareNumber) {
    const count = parseInt(bareNumber[1], 10);
    return count >= 2 ? { count, unitSingular: "", rest: "" } : null;
  }

  const match = trimmed.match(/^(\d+)\s+([a-zàèéìòù]+)(.*)$/i);
  if (!match) return null;
  const count = parseInt(match[1], 10);
  const unitSingular = SINGULAR_OF[match[2].toLowerCase()];
  if (!unitSingular || count < 2) return null;
  return { count, unitSingular, rest: match[3] };
}

export function formatCountableQuantity({ count, unitSingular, rest }: CountableQuantity): string {
  if (!unitSingular) return `${count}${rest}`;
  const word = count === 1 ? unitSingular : (PLURAL_OF[unitSingular] ?? unitSingular);
  return `${count} ${word}${rest}`;
}
