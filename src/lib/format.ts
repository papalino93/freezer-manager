import { formatDateIt } from "@/lib/dates";
import type { ProductDTO } from "@/lib/types";

/**
 * Riga secondaria della card prodotto: distingue sempre data reale, data
 * stimata e nessuna data (punto 60), con la dicitura giusta per ciascuna.
 */
export function getDateLine(product: ProductDTO): string {
  if (product.expiryDate) {
    return `Scade il ${formatDateIt(new Date(product.expiryDate))}`;
  }
  if (product.recommendedConsumptionDate) {
    return `Consumo consigliato entro il ${formatDateIt(
      new Date(product.recommendedConsumptionDate)
    )}`;
  }
  return "Nessuna data di consumo indicata";
}

export function getFrozenLine(product: ProductDTO): string | null {
  if (!product.frozenDate) return null;
  return `Congelato il ${formatDateIt(new Date(product.frozenDate))}`;
}
