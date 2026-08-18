import type { Product } from "@/generated/prisma/client";
import { getFreshness } from "@/lib/dates";
import type { ProductDTO } from "@/lib/types";

export type { ProductDTO } from "@/lib/types";

/**
 * Forma "pronta per la UI" di un prodotto: date come stringhe ISO (per
 * poter attraversare il confine server/client di Next.js) più lo stato di
 * freschezza già calcolato, così ogni componente usa la stessa logica.
 */
export function toProductDTO(product: Product): ProductDTO {
  return {
    id: product.id,
    freezerId: product.freezerId,
    name: product.name,
    brand: product.brand,
    category: product.category,
    quantity: product.quantity,
    notes: product.notes,
    purchaseDate: product.purchaseDate?.toISOString() ?? null,
    frozenDate: product.frozenDate?.toISOString() ?? null,
    expiryDate: product.expiryDate?.toISOString() ?? null,
    recommendedConsumptionDate: product.recommendedConsumptionDate?.toISOString() ?? null,
    dateSource: product.dateSource,
    dateReason: product.dateReason,
    dateReference: product.dateReference,
    status: product.status,
    consumedAt: product.consumedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    freshness: getFreshness({
      expiryDate: product.expiryDate,
      recommendedConsumptionDate: product.recommendedConsumptionDate,
    }),
  };
}
