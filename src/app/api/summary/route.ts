import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFreshness } from "@/lib/dates";
import { CATEGORIES } from "@/lib/categories";
import { requireAccessibleFreezers } from "@/lib/api-auth";

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
  for (const p of products) {
    const freshness = getFreshness(p);
    if (freshness.level === "orange") orange += 1;
    if (freshness.level === "red") red += 1;
  }

  type ActiveProduct = (typeof products)[number];
  const byCategory = CATEGORIES.map((c) => ({
    category: c.value,
    count: products.filter((p: ActiveProduct) => p.category === c.value).length,
  })).filter((c) => c.count > 0);

  return NextResponse.json({
    total: products.length,
    orange,
    red,
    byCategory,
  });
}
