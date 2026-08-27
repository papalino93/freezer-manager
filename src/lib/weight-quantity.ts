// Riconosce quantità a peso/volume scritte in modo naturale ("2 kg", "500
// g", "1.5 l", "250 ml", "2 litri"...) per permettere di consumarne una
// PARTE (es. "300 g" da "2 kg"), esattamente come countable-quantity.ts fa
// per le quantità a unità separate ("1 scatola" su "5 scatole").
//
// Non converte mai tra famiglie diverse (peso <-> volume): un prodotto in
// kg si consuma sempre in g/kg, uno in litri sempre in ml/l — non avrebbe
// senso "consumare 300 ml" da "2 kg" di carne.

export type UnitFamily = "mass" | "volume";

const MASS_FACTORS: Record<string, number> = {
  g: 1,
  gr: 1,
  grammo: 1,
  grammi: 1,
  kg: 1000,
  kilo: 1000,
  kili: 1000,
  chilo: 1000,
  chili: 1000,
};

const VOLUME_FACTORS: Record<string, number> = {
  ml: 1,
  millilitro: 1,
  millilitri: 1,
  cl: 10,
  centilitro: 10,
  centilitri: 10,
  dl: 100,
  decilitro: 100,
  decilitri: 100,
  l: 1000,
  lt: 1000,
  litro: 1000,
  litri: 1000,
};

const ALL_UNITS = [...Object.keys(MASS_FACTORS), ...Object.keys(VOLUME_FACTORS)];
// Le unità più lunghe prima ("litri" prima di "l"): un'alternanza regex
// prende la prima che soddisfa l'intero pattern, e senza questo ordine
// "l" da solo matcherebbe già il prefisso di "litri" lasciando "itri" nel
// gruppo "rest" invece di riconoscere la parola intera.
const UNITS_PATTERN = ALL_UNITS.sort((a, b) => b.length - a.length).join("|");
const QUANTITY_RE = new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${UNITS_PATTERN})\\b(.*)$`, "i");

function familyAndFactor(unit: string): { family: UnitFamily; factor: number } | null {
  const key = unit.toLowerCase();
  if (key in MASS_FACTORS) return { family: "mass", factor: MASS_FACTORS[key] };
  if (key in VOLUME_FACTORS) return { family: "volume", factor: VOLUME_FACTORS[key] };
  return null;
}

export interface WeightQuantity {
  /** Valore convertito in unità base: grammi per la massa, millilitri per il volume. */
  valueBase: number;
  /** Unità così come scritta nel testo originale (es. "kg"), per riformattare nello stesso "tono". */
  unit: string;
  family: UnitFamily;
  /** Qualsiasi cosa segua l'unità riconosciuta (di solito vuoto). */
  rest: string;
}

export function parseWeightQuantity(quantity: string | null | undefined): WeightQuantity | null {
  if (!quantity) return null;
  const trimmed = quantity.trim();

  const match = trimmed.match(QUANTITY_RE);
  if (!match) return null;

  const value = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;

  const info = familyAndFactor(match[2]);
  if (!info) return null;

  return { valueBase: value * info.factor, unit: match[2], family: info.family, rest: match[3] };
}

function roundTrim(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatWeightQuantity({ valueBase, unit, rest }: WeightQuantity): string {
  const info = familyAndFactor(unit);
  const factor = info?.factor ?? 1;
  return `${roundTrim(valueBase / factor)} ${unit}${rest}`;
}

/**
 * Converte un valore scritto in una data unità nella base (g o ml).
 * Torna null se l'unità non è riconosciuta o non è della stessa famiglia
 * (peso/volume) a cui si vuole sommare/sottrarre — niente "300 ml" da un
 * prodotto in kg.
 */
export function toBaseValue(amount: number, unit: string, family: UnitFamily): number | null {
  const info = familyAndFactor(unit);
  if (!info || info.family !== family) return null;
  return amount * info.factor;
}

// Unità selezionabili per consumarne una parte, raggruppate per famiglia:
// chi ha "2 kg" può scegliere di consumarne un po' in grammi o in chili.
// La prima di ciascuna lista è la più "fine" (proposta di default: si
// consuma più spesso in grammi/millilitri che in chili/litri interi).
export const UNITS_BY_FAMILY: Record<UnitFamily, string[]> = {
  mass: ["g", "kg"],
  volume: ["ml", "l"],
};
