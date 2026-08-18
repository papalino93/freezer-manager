import type { CategoryValue } from "@/lib/types";
import type { ParsedListItem } from "@/services/ai/schemas";

export interface ImportItem {
  key: string;
  name: string;
  category: CategoryValue;
  quantity: string;
  purchaseDate: string;
  frozenDate: string;
  expiryDate: string;
  uncertainFields: string[];
  rawText: string;
}

export function parsedItemToImportItem(item: ParsedListItem, index: number): ImportItem {
  return {
    key: `${index}-${item.name}`,
    name: item.name,
    category: item.category,
    quantity: item.quantity ?? "",
    purchaseDate: item.purchaseDate ?? "",
    frozenDate: item.frozenDate ?? "",
    expiryDate: item.expiryDate ?? "",
    uncertainFields: item.uncertainFields,
    rawText: item.rawText,
  };
}

const FIELD_LABELS: Record<string, string> = {
  name: "nome",
  category: "categoria",
  quantity: "quantità",
  purchaseDate: "data di acquisto",
  frozenDate: "data di congelamento",
  expiryDate: "data di scadenza",
};

export function describeUncertainFields(fields: string[]): string {
  const labels = fields.map((f) => FIELD_LABELS[f] ?? f);
  return `Poco leggibile: ${labels.join(", ")}`;
}
