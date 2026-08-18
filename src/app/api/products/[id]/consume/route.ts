import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/serialize";
import { requireActiveFreezer } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

// Segna un prodotto come consumato. Niente cancellazioni silenziose
// (punto 45): il prodotto resta nello storico, cambia solo lo stato.
export async function POST(_request: NextRequest, { params }: Context) {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const existing = await prisma.product.findFirst({ where: { id, freezerId: ctx.freezerId } });
  if (!existing) {
    return NextResponse.json({ error: "Prodotto non trovato." }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { status: "CONSUMED", consumedAt: new Date() },
  });

  return NextResponse.json({ product: toProductDTO(product) });
}

// Annulla il consumo (utile in caso di errore da "Storico").
export async function DELETE(_request: NextRequest, { params }: Context) {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const existing = await prisma.product.findFirst({ where: { id, freezerId: ctx.freezerId } });
  if (!existing) {
    return NextResponse.json({ error: "Prodotto non trovato." }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: { status: "ACTIVE", consumedAt: null },
  });

  return NextResponse.json({ product: toProductDTO(product) });
}
