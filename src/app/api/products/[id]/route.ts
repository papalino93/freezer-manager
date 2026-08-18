import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/serialize";
import { productInputSchema } from "@/lib/product-schema";
import { buildProductData } from "@/lib/build-product-data";
import { requireProductAccess } from "@/lib/api-auth";
import { assertFreezerMember } from "@/lib/freezer";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const ctx = await requireProductAccess(id);
  if ("error" in ctx) return ctx.error;

  return NextResponse.json({ product: toProductDTO(ctx.product) });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const ctx = await requireProductAccess(id);
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controlla i dati inseriti.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Sposta il prodotto in un altro congelatore, se richiesto: deve essere
  // uno a cui l'utente ha accesso, altrimenti resta dove sta.
  let targetFreezerId = ctx.product.freezerId;
  if (typeof body.freezerId === "string" && body.freezerId !== targetFreezerId) {
    if (!(await assertFreezerMember(ctx.userId, body.freezerId))) {
      return NextResponse.json(
        { error: "Non hai accesso al congelatore scelto." },
        { status: 403 }
      );
    }
    targetFreezerId = body.freezerId;
  }

  const data = buildProductData(parsed.data, targetFreezerId);
  const product = await prisma.product.update({ where: { id }, data });

  return NextResponse.json({ product: toProductDTO(product) });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const ctx = await requireProductAccess(id);
  if ("error" in ctx) return ctx.error;

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
