import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/serialize";
import { productInputSchema } from "@/lib/product-schema";
import { buildProductData } from "@/lib/build-product-data";
import { requireActiveFreezer } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id, freezerId: ctx.freezerId } });
  if (!product) {
    return NextResponse.json({ error: "Prodotto non trovato." }, { status: 404 });
  }
  return NextResponse.json({ product: toProductDTO(product) });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
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

  const existing = await prisma.product.findFirst({ where: { id, freezerId: ctx.freezerId } });
  if (!existing) {
    return NextResponse.json({ error: "Prodotto non trovato." }, { status: 404 });
  }

  const data = buildProductData(parsed.data, ctx.freezerId);
  const product = await prisma.product.update({ where: { id }, data });

  return NextResponse.json({ product: toProductDTO(product) });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const existing = await prisma.product.findFirst({ where: { id, freezerId: ctx.freezerId } });
  if (!existing) {
    return NextResponse.json({ error: "Prodotto non trovato." }, { status: 404 });
  }
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
