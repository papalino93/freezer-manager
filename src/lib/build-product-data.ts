import type { Category, Prisma } from "@/generated/prisma/client";
import type { ProductInput } from "@/lib/product-schema";
import { estimateConsumptionDate } from "@/lib/storage-guide";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Trasforma l'input validato (form manuale o conferma import AI) nei campi
 * pronti per Prisma, applicando la stessa regola ovunque nell'app:
 * - se c'è una vera scadenza, quella vince ed è "actual"
 * - altrimenti, se richiesto e disponibile una data di congelamento,
 *   calcoliamo una stima dichiarata come tale
 * - altrimenti nessuna data: mai inventata (punto 23)
 */
export function buildProductData(
  input: ProductInput,
  freezerId: string
): Prisma.ProductUncheckedCreateInput {
  const purchaseDate = parseDate(input.purchaseDate);
  const frozenDate = parseDate(input.frozenDate);
  const expiryDate = parseDate(input.expiryDate);

  const base = {
    freezerId,
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    category: input.category as Category,
    quantity: input.quantity?.trim() || null,
    notes: input.notes?.trim() || null,
    purchaseDate,
    frozenDate,
    expiryDate,
  };

  if (expiryDate) {
    return {
      ...base,
      recommendedConsumptionDate: null,
      dateSource: "ACTUAL",
      dateReason: null,
      dateReference: null,
    };
  }

  if (input.autoEstimate && frozenDate) {
    const estimate = estimateConsumptionDate(base.category, frozenDate);
    return {
      ...base,
      recommendedConsumptionDate: estimate.date,
      dateSource: "ESTIMATED",
      dateReason: estimate.reason,
      dateReference: estimate.source,
    };
  }

  return {
    ...base,
    recommendedConsumptionDate: null,
    dateSource: "MISSING",
    dateReason: null,
    dateReference: null,
  };
}
