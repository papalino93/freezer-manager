import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/serialize";
import { requireProductAccess } from "@/lib/api-auth";
import { parseCountableQuantity, formatCountableQuantity } from "@/lib/countable-quantity";

type Context = { params: Promise<{ id: string }> };

// Segna un prodotto come consumato. Niente cancellazioni silenziose
// (punto 45): il prodotto resta nello storico, cambia solo lo stato.
//
// Se il body porta un "amount" e la quantità è numerabile (es. "5
// scatole") e ne restano di più di quante consumate, si tratta di un
// consumo PARZIALE: il prodotto resta ACTIVE con la quantità scalata, e il
// consumo va registrato a parte (ConsumptionLog) perché altrimenti non
// lascerebbe nessuna traccia nello Storico (bug segnalato dall'utente).
export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const ctx = await requireProductAccess(id);
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  const amount = typeof body?.amount === "number" && Number.isFinite(body.amount) ? body.amount : null;

  // Un amount esplicito ma non valido (0, negativo, non intero) non deve
  // scivolare silenziosamente nel "consuma tutto": è una richiesta
  // malformata, va rifiutata invece di consumare più di quanto chiesto.
  if (amount !== null && (amount <= 0 || !Number.isInteger(amount))) {
    return NextResponse.json({ error: "Quantità non valida." }, { status: 400 });
  }

  const countable = parseCountableQuantity(ctx.product.quantity);
  const isPartial = amount !== null && countable !== null && amount < countable.count;

  if (!isPartial) {
    const product = await prisma.product.update({
      where: { id },
      data: { status: "CONSUMED", consumedAt: new Date() },
    });
    return NextResponse.json({ product: toProductDTO(product) });
  }

  const nextQuantity = formatCountableQuantity({ ...countable, count: countable.count - amount });

  const [product, log] = await prisma.$transaction([
    prisma.product.update({ where: { id }, data: { quantity: nextQuantity } }),
    prisma.consumptionLog.create({
      data: {
        freezerId: ctx.product.freezerId,
        productId: ctx.product.id,
        name: ctx.product.name,
        category: ctx.product.category,
        amount,
        unit: countable.unitSingular,
      },
    }),
  ]);

  return NextResponse.json({
    product: toProductDTO(product),
    log: { id: log.id, amount: log.amount, unit: log.unit, consumedAt: log.consumedAt.toISOString() },
  });
}

// Annulla il consumo (utile in caso di errore da "Storico").
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const ctx = await requireProductAccess(id);
  if ("error" in ctx) return ctx.error;

  const product = await prisma.product.update({
    where: { id },
    data: { status: "ACTIVE", consumedAt: null },
  });

  return NextResponse.json({ product: toProductDTO(product) });
}
