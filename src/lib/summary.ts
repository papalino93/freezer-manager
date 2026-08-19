import type { ProductDTO, SummaryDTO } from "@/lib/types";
import type { FreshnessLevel } from "@/lib/dates";
import { CATEGORY_GROUPS } from "@/lib/categories";

// Stessa gravità usata prima lato server: basta un solo prodotto rosso per
// colorare di rosso il pallino di stato di tutto il gruppo.
const FRESHNESS_SEVERITY: Record<FreshnessLevel, number> = { red: 3, orange: 2, green: 1, none: 0 };

/**
 * Calcolato dalla lista prodotti già scaricata dalla home, invece che con
 * una seconda chiamata a /api/summary: evita una query di autenticazione e
 * una di lettura prodotti in più ad ogni apertura dell'app, e resta sempre
 * coerente con la lista visibile (niente conteggi per categoria rimasti
 * indietro dopo un consumo/annullamento).
 */
export function computeSummary(products: ProductDTO[]): SummaryDTO {
  let orange = 0;
  let red = 0;
  for (const p of products) {
    if (p.freshness.level === "orange") orange += 1;
    if (p.freshness.level === "red") red += 1;
  }

  const byCategory = CATEGORY_GROUPS.map((group) => {
    const items = products.filter((p) => group.values.includes(p.category));
    const worstFreshness = items.reduce<FreshnessLevel>(
      (worst, p) =>
        FRESHNESS_SEVERITY[p.freshness.level] > FRESHNESS_SEVERITY[worst] ? p.freshness.level : worst,
      "none"
    );
    const worstCount = items.filter((p) => p.freshness.level === worstFreshness).length;
    return { category: group.key, count: items.length, worstFreshness, worstCount };
  }).filter((c) => c.count > 0);

  return { total: products.length, orange, red, byCategory };
}
