import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFreshness, type FreshnessLevel } from "@/lib/dates";
import { CATEGORIES } from "@/lib/categories";
import { requireAccessibleFreezers } from "@/lib/api-auth";

// Ordine di gravità per scegliere il pallino di stato di una categoria:
// basta un solo prodotto rosso per colorare tutta la card di rosso.
const FRESHNESS_SEVERITY: Record<FreshnessLevel, number> = { red: 3, orange: 2, green: 1, none: 0 };

// Riepilogo per l'intestazione della home: totale prodotti, quanti da
// consumare presto, quanti urgenti, e il conteggio per categoria. Somma
// tutti i congelatori dell'utente (vista unificata).
export async function GET() {
  const ctx = await requireAccessibleFreezers();
  if ("error" in ctx) return ctx.error;

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", freezerId: { in: ctx.freezerIds } },
    select: { category: true, expiryDate: true, recommendedConsumptionDate: true },
  });

  let orange = 0;
  let red = 0;
  const productsWithFreshness = products.map((p) => ({ ...p, freshness: getFreshness(p) }));
  for (const { freshness } of productsWithFreshness) {
    if (freshness.level === "orange") orange += 1;
    if (freshness.level === "red") red += 1;
  }

  type ActiveProduct = (typeof productsWithFreshness)[number];
  const byCategory = CATEGORIES.map((c) => {
    const items = productsWithFreshness.filter((p: ActiveProduct) => p.category === c.value);
    const worstFreshness = items.reduce<FreshnessLevel>(
      (worst, p) => (FRESHNESS_SEVERITY[p.freshness.level] > FRESHNESS_SEVERITY[worst] ? p.freshness.level : worst),
      "none"
    );
    return { category: c.value, count: items.length, worstFreshness };
  }).filter((c) => c.count > 0);

  return NextResponse.json({
    total: products.length,
    orange,
    red,
    byCategory,
  });
}
