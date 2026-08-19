import type { Category } from "@/generated/prisma/client";

export interface CategoryMeta {
  value: Category;
  label: string;
  emoji: string;
}

// Ordine di visualizzazione voluto dalla specifica (punto 17).
export const CATEGORIES: CategoryMeta[] = [
  { value: "CARNE", label: "Carne", emoji: "🥩" },
  { value: "PESCE", label: "Pesce", emoji: "🐟" },
  { value: "VERDURE", label: "Verdure", emoji: "🥦" },
  { value: "PIATTI_PRONTI", label: "Piatti pronti", emoji: "🍝" },
  { value: "PIZZA", label: "Pizza", emoji: "🍕" },
  { value: "PANE", label: "Pane e prodotti da forno", emoji: "🍞" },
  { value: "DOLCI", label: "Dolci", emoji: "🍰" },
  { value: "GELATI", label: "Gelati", emoji: "🍦" },
  { value: "LATTICINI", label: "Latticini", emoji: "🧀" },
  { value: "SUGHI", label: "Sughi e preparazioni", emoji: "🥣" },
  { value: "ALTRO", label: "Altro", emoji: "🧊" },
];

const CATEGORY_MAP = new Map<string, CategoryMeta>(CATEGORIES.map((c) => [c.value, c]));

export function getCategoryMeta(category: Category | string): CategoryMeta {
  return CATEGORY_MAP.get(category) ?? CATEGORIES[CATEGORIES.length - 1];
}

export interface CategoryGroup {
  /** Valore salvato quando si sceglie questo gruppo per un prodotto nuovo. */
  key: Category;
  label: string;
  emoji: string;
  /** Tutti i valori che rientrano in questo gruppo, "key" incluso. */
  values: Category[];
}

// Griglia e scelta categoria semplificate (11 voci erano troppe da scorrere
// a colpo d'occhio): alcune categorie affini sono raggruppate visivamente.
// I dati restano precisi come prima — un prodotto già salvato come "Pizza"
// o "Gelati" resta quel valore, conta solo nel gruppo giusto in home — ed
// è per questo che qui non serve nessuna migrazione del database.
export const CATEGORY_GROUPS: CategoryGroup[] = [
  { key: "CARNE", label: "Carne", emoji: "🥩", values: ["CARNE"] },
  { key: "PESCE", label: "Pesce", emoji: "🐟", values: ["PESCE"] },
  { key: "VERDURE", label: "Verdure", emoji: "🥦", values: ["VERDURE"] },
  { key: "PANE", label: "Pane e prodotti da forno", emoji: "🍞", values: ["PANE"] },
  {
    key: "PIATTI_PRONTI",
    label: "Piatti pronti e sughi",
    emoji: "🍝",
    values: ["PIATTI_PRONTI", "SUGHI", "PIZZA"],
  },
  { key: "DOLCI", label: "Dolci e gelati", emoji: "🍰", values: ["DOLCI", "GELATI"] },
  { key: "LATTICINI", label: "Latticini", emoji: "🧀", values: ["LATTICINI"] },
  { key: "ALTRO", label: "Altro", emoji: "🧊", values: ["ALTRO"] },
];

const CATEGORY_GROUP_MAP = new Map<string, CategoryGroup>(CATEGORY_GROUPS.map((g) => [g.key, g]));
const CATEGORY_TO_GROUP = new Map<string, CategoryGroup>(
  CATEGORY_GROUPS.flatMap((g) => g.values.map((v) => [v, g] as const))
);

export function getCategoryGroupMeta(groupKey: Category | string): CategoryGroup {
  return CATEGORY_GROUP_MAP.get(groupKey) ?? CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1];
}

export function getCategoryGroupFor(category: Category | string): CategoryGroup {
  return CATEGORY_TO_GROUP.get(category) ?? CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1];
}
