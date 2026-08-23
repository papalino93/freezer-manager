import type { CATEGORY_VALUES } from "@/lib/product-schema";
import type { FreshnessInfo, FreshnessLevel } from "@/lib/dates";

// Tipi "puri" (nessun import dal client Prisma generato) così i componenti
// client possono usarli senza trascinarsi dentro il runtime del database.
export type CategoryValue = (typeof CATEGORY_VALUES)[number];
export type DateSourceValue = "ACTUAL" | "ESTIMATED" | "MISSING";
export type ProductStatusValue = "ACTIVE" | "CONSUMED";

export interface ProductDTO {
  id: string;
  freezerId: string;
  // Presente solo dove serve mostrare il badge del congelatore (vista
  // unificata): non tutte le route lo calcolano.
  freezerName?: string;
  name: string;
  brand: string | null;
  category: CategoryValue;
  quantity: string | null;
  notes: string | null;
  purchaseDate: string | null;
  frozenDate: string | null;
  expiryDate: string | null;
  recommendedConsumptionDate: string | null;
  dateSource: DateSourceValue;
  dateReason: string | null;
  dateReference: string | null;
  status: ProductStatusValue;
  consumedAt: string | null;
  createdAt: string;
  freshness: FreshnessInfo;
}

// Un consumo parziale (es. "1 scatola" su "5 scatole"): il prodotto resta
// ACTIVE, quindi questa è l'unica traccia che ne rimane nello Storico.
export interface ConsumptionLogDTO {
  id: string;
  // Assente se il prodotto è stato nel frattempo cancellato del tutto:
  // in quel caso il consumo resta nello storico ma non è più annullabile.
  productId: string | null;
  freezerId: string;
  freezerName?: string;
  name: string;
  category: CategoryValue;
  amount: number;
  unit: string;
  consumedAt: string;
}

export interface SummaryDTO {
  total: number;
  orange: number;
  red: number;
  // worstFreshness: il livello peggiore tra i prodotti della categoria, per
  // mostrare un pallino di stato sulla card senza doverci entrare.
  // worstCount: quanti prodotti sono in quel livello peggiore.
  byCategory: {
    category: CategoryValue;
    count: number;
    worstFreshness: FreshnessLevel;
    worstCount: number;
  }[];
}
