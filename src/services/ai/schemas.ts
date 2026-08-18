import { z } from "zod";
import { CATEGORY_VALUES } from "@/lib/product-schema";

// Data in formato ISO "YYYY-MM-DD", oppure null se non leggibile/assente.
// Non accettiamo mai una stringa vuota: o è una data valida, o è null.
const aiDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

export const categoryEnum = z.enum(CATEGORY_VALUES);

/**
 * Un singolo prodotto riconosciuto da una foto di confezione (punto 31).
 */
export const recognizedPackageSchema = z.object({
  name: z
    .string()
    .nullable()
    .describe("Nome del prodotto così come appare sulla confezione, es. 'Sofficini Prosciutto e Mozzarella'. null se illeggibile."),
  brand: z.string().nullable().describe("Marca, se visibile. null altrimenti."),
  category: categoryEnum.describe("Categoria più adatta tra quelle disponibili."),
  quantity: z
    .string()
    .nullable()
    .describe("Quantità/peso come testo libero, es. '4 pezzi' o '450 g'. null se non visibile."),
  expiryDate: aiDate.describe(
    "Vera data di scadenza stampata sulla confezione, in formato YYYY-MM-DD. null se non presente o non leggibile: NON indovinare mai una data."
  ),
  expiryDateLegible: z
    .boolean()
    .describe("true se sulla confezione c'era una data di scadenza ma non è stato possibile leggerla con certezza."),
  confidence: z.number().min(0).max(1).describe("Quanto sei sicuro del riconoscimento complessivo, da 0 a 1."),
  warnings: z
    .array(z.string())
    .describe("Avvisi brevi in italiano per l'utente, es. 'Data di scadenza non riconosciuta'. Array vuoto se nessun avviso."),
});
export type RecognizedPackage = z.infer<typeof recognizedPackageSchema>;

/**
 * Una riga estratta dal foglio cartaceo (punto 37).
 */
export const parsedListItemSchema = z.object({
  name: z.string().describe("Descrizione del prodotto così come scritta sul foglio."),
  category: categoryEnum.describe("Categoria più plausibile in base alla descrizione."),
  quantity: z.string().nullable().describe("Quantità se indicata sul foglio, altrimenti null."),
  purchaseDate: aiDate.describe("Data di acquisto se scritta sul foglio, formato YYYY-MM-DD, altrimenti null."),
  frozenDate: aiDate.describe("Data di congelamento se scritta sul foglio, formato YYYY-MM-DD, altrimenti null."),
  expiryDate: aiDate.describe("Data di scadenza se scritta sul foglio, formato YYYY-MM-DD, altrimenti null."),
  uncertainFields: z
    .array(z.string())
    .describe(
      "Nomi dei campi letti con incertezza (es. 'expiryDate', 'name') perché la grafia era poco chiara. Array vuoto se tutto è leggibile."
    ),
  rawText: z.string().describe("Il testo della riga così come appare sul foglio, per riferimento."),
});
export type ParsedListItem = z.infer<typeof parsedListItemSchema>;

export const parsedListSchema = z.object({
  items: z.array(parsedListItemSchema),
  notes: z
    .string()
    .nullable()
    .describe("Eventuali osservazioni generali sulla leggibilità del foglio, o null."),
});
export type ParsedList = z.infer<typeof parsedListSchema>;
