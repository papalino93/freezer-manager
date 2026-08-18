import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/serialize";
import { productInputSchema } from "@/lib/product-schema";
import { buildProductData } from "@/lib/build-product-data";
import { requireAccessibleFreezers, requireSession } from "@/lib/api-auth";
import { assertFreezerMember } from "@/lib/freezer";
import type { Category, Prisma, Product } from "@/generated/prisma/client";
import { CATEGORY_VALUES } from "@/lib/product-schema";

// Vista unificata: elenca i prodotti di TUTTI i congelatori dell'utente
// insieme, non di uno solo. Ogni prodotto porta il nome del suo
// congelatore per il badge sulla card.
export async function GET(request: NextRequest) {
  const ctx = await requireAccessibleFreezers();
  if ("error" in ctx) return ctx.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") === "consumed" ? "CONSUMED" : "ACTIVE";
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") ?? "expiry-asc";

  const where: Prisma.ProductWhereInput = { status, freezerId: { in: ctx.freezerIds } };

  if (category && (CATEGORY_VALUES as readonly string[]).includes(category)) {
    where.category = category as Category;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "expiry-desc"
      ? [{ expiryDate: "desc" }, { recommendedConsumptionDate: "desc" }, { name: "asc" }]
      : sort === "recent"
        ? [{ createdAt: "desc" }]
        : sort === "name"
          ? [{ name: "asc" }]
          : [{ expiryDate: "asc" }, { recommendedConsumptionDate: "asc" }, { name: "asc" }];

  const products = await prisma.product.findMany({ where, orderBy });

  // Per l'ordinamento "scadenza più vicina/lontana" vogliamo i prodotti
  // senza nessuna data in fondo, non mescolati in base al valore NULL di
  // Postgres: li spostiamo qui invece di complicare la query SQL.
  const isExpirySort = sort === "expiry-asc" || sort === "expiry-desc" || sort === undefined;
  let ordered = products;
  if (isExpirySort) {
    const withDate = products.filter((p: Product) => p.expiryDate || p.recommendedConsumptionDate);
    const withoutDate = products.filter(
      (p: Product) => !p.expiryDate && !p.recommendedConsumptionDate
    );
    ordered = [...withDate, ...withoutDate];
  }

  const freezerNames = new Map(ctx.freezers.map((f) => [f.id, f.name]));
  const dto = ordered.map((p: Product) => ({
    ...toProductDTO(p),
    freezerName: freezerNames.get(p.freezerId),
  }));

  return NextResponse.json({ products: dto });
}

export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const freezerId = typeof body.freezerId === "string" ? body.freezerId : null;
  if (!freezerId || !(await assertFreezerMember(ctx.userId, freezerId))) {
    return NextResponse.json(
      { error: "Scegli in quale congelatore mettere il prodotto." },
      { status: 400 }
    );
  }

  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controlla i dati inseriti.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = buildProductData(parsed.data, freezerId);
  const product = await prisma.product.create({ data });

  return NextResponse.json({ product: toProductDTO(product) }, { status: 201 });
}
