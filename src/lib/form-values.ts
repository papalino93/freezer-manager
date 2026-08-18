import type { CategoryValue, ProductDTO } from "@/lib/types";

export interface ProductFormValues {
  name: string;
  brand: string;
  category: CategoryValue;
  quantity: string;
  notes: string;
  purchaseDate: string; // "" oppure "YYYY-MM-DD"
  frozenDate: string;
  expiryDate: string;
  autoEstimate: boolean;
}

export function emptyFormValues(defaults?: Partial<ProductFormValues>): ProductFormValues {
  return {
    name: "",
    brand: "",
    category: "ALTRO",
    quantity: "",
    notes: "",
    purchaseDate: "",
    frozenDate: "",
    expiryDate: "",
    autoEstimate: true,
    ...defaults,
  };
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function productToFormValues(product: ProductDTO): ProductFormValues {
  return {
    name: product.name,
    brand: product.brand ?? "",
    category: product.category,
    quantity: product.quantity ?? "",
    notes: product.notes ?? "",
    purchaseDate: toDateInputValue(product.purchaseDate),
    frozenDate: toDateInputValue(product.frozenDate),
    expiryDate: toDateInputValue(product.expiryDate),
    // Riflette lo stato reale salvato: se l'utente aveva scelto "nessuna
    // stima" (MISSING), riaprire "Modifica" non deve rispuntare la casella
    // e reintrodurre una data che aveva esplicitamente rifiutato.
    autoEstimate: product.dateSource === "ESTIMATED",
  };
}

export function formValuesToPayload(values: ProductFormValues) {
  return {
    name: values.name,
    brand: values.brand || null,
    category: values.category,
    quantity: values.quantity || null,
    notes: values.notes || null,
    purchaseDate: values.purchaseDate || null,
    frozenDate: values.frozenDate || null,
    expiryDate: values.expiryDate || null,
    autoEstimate: values.autoEstimate,
  };
}
