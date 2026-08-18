import { z } from "zod";

// Le categorie sono ripetute qui (invece di importarle da Prisma) perché
// questo file viene importato anche da componenti client, che non possono
// caricare il client Prisma.
export const CATEGORY_VALUES = [
  "CARNE",
  "PESCE",
  "VERDURE",
  "PIATTI_PRONTI",
  "PIZZA",
  "PANE",
  "DOLCI",
  "GELATI",
  "LATTICINI",
  "SUGHI",
  "ALTRO",
] as const;

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Data non valida")
  .nullish();

// Schema per l'inserimento/modifica manuale di un prodotto. Quasi tutto è
// opzionale: la specifica vieta di rendere obbligatori i campi non
// essenziali (punto 29).
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Serve almeno un nome").max(200),
  brand: z.string().trim().max(200).optional().nullable(),
  category: z.enum(CATEGORY_VALUES),
  quantity: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  purchaseDate: isoDate,
  frozenDate: isoDate,
  expiryDate: isoDate,
  // Se true e manca expiryDate, il server calcola una stima automaticamente.
  autoEstimate: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const sortOptions = [
  "expiry-asc",
  "expiry-desc",
  "recent",
  "name",
] as const;
export type SortOption = (typeof sortOptions)[number];
