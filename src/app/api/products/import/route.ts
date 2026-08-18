import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { productInputSchema } from "@/lib/product-schema";
import { buildProductData } from "@/lib/build-product-data";
import { requireSession } from "@/lib/api-auth";
import { assertFreezerMember } from "@/lib/freezer";

const importSchema = z.object({
  freezerId: z.string().min(1),
  items: z.array(productInputSchema).min(1).max(200),
});

// Crea più prodotti in un solo colpo, usata dalla schermata di revisione
// dell'importazione (foglio cartaceo). I record vengono creati solo dopo
// che l'utente ha controllato e confermato tutto (punto 39).
export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controlla i dati inseriti.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  if (!(await assertFreezerMember(ctx.userId, parsed.data.freezerId))) {
    return NextResponse.json(
      { error: "Scegli in quale congelatore importare i prodotti." },
      { status: 400 }
    );
  }

  const data = parsed.data.items.map((item) => buildProductData(item, parsed.data.freezerId));
  const created = await prisma.$transaction(
    data.map((productData) => prisma.product.create({ data: productData }))
  );

  return NextResponse.json({ count: created.length }, { status: 201 });
}
