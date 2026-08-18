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
