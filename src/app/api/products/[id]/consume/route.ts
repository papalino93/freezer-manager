import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toProductDTO } from "@/lib/serialize";
import { requireProductAccess } from "@/lib/api-auth";
import { parseCountableQuantity, formatCountableQuantity } from "@/lib/countable-quantity";
import { parseWeightQuantity, formatWeightQuantity, toBaseValue } from "@/lib/weight-quantity";

type Context = { params: Promise<{ id: string }> };

// Segna un prodotto come consumato. Niente cancellazioni silenziose
// (punto 45): il prodotto resta nello storico, cambia solo lo stato.
//
// Un consumo può anche essere PARZIALE, in due varianti (il prodotto resta
// ACTIVE con la quantità scalata, e va registrato a parte con un
// ConsumptionLog perché altrimenti non lascerebbe nessuna traccia nello
// Storico — bug segnalato dall'utente):
// - body.amount: quantità numerabile ("5 scatole" -> ne consumo 1);
// - body.weightAmount + body.weightUnit: peso/volume ("2 kg" -> ne
//   consumo "300 g").
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

  const rawWeightAmount =
    typeof body?.weightAmount === "number" && Number.isFinite(body.weightAmount) ? body.weightAmount : null;
  const weightUnit = typeof body?.weightUnit === "string" ? body.weightUnit : null;
  // Arrotondato subito: sia la quantità scalata sul prodotto sia la riga di
  // storico usano questo stesso valore, niente decimali fantasma tipo
  // "300.0000000001 g" per un semplice errore di virgola mobile. Il
  // controllo ">0" va fatto DOPO l'arrotondamento: un valore minuscolo
  // (es. "0.001 kg") arrotonderebbe altrimenti a 0 e creerebbe una riga di
  // storico fantasma "0 kg consumati" senza scalare nulla.
  const weightAmount = rawWeightAmount !== null ? Math.round(rawWeightAmount * 100) / 100 : null;
  if (weightAmount !== null && weightAmount <= 0) {
    return NextResponse.json({ error: "Quantità non valida." }, { status: 400 });
  }

  // Consumo parziale a UNITÀ (es. "1 scatola" su "5 scatole").
  const countable = parseCountableQuantity(ctx.product.quantity);
  if (amount !== null && countable !== null && amount < countable.count) {
    const nextQuantity = formatCountableQuantity({ ...countable, count: countable.count - amount });

    const [product, log] = await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { quantity: nextQuantity } }),
      prisma.consumptionLog.create({
        data: {
          freezerId: ctx.product.freezerId,
          productId: ctx.product.id,
          name: ctx.product.name,
          category: ctx.product.category,
          kind: "COUNTABLE",
          amount,
          unit: countable.unitSingular,
        },
      }),
    ]);

    return NextResponse.json({
      product: toProductDTO(product),
      log: {
        id: log.id,
        amount: log.amount,
        unit: log.unit,
        kind: log.kind,
        consumedAt: log.consumedAt.toISOString(),
      },
    });
  }

  // Consumo parziale a PESO/VOLUME (es. "300 g" su "2 kg").
  const weight = parseWeightQuantity(ctx.product.quantity);
  if (weightAmount !== null && weightUnit !== null && weight !== null) {
    const consumedBase = toBaseValue(weightAmount, weightUnit, weight.family);
    if (consumedBase === null) {
      return NextResponse.json(
        { error: "Unità non compatibile con la quantità del prodotto." },
        { status: 400 }
      );
    }

    if (consumedBase < weight.valueBase) {
      const nextQuantity = formatWeightQuantity({ ...weight, valueBase: weight.valueBase - consumedBase });

      const [product, log] = await prisma.$transaction([
        prisma.product.update({ where: { id }, data: { quantity: nextQuantity } }),
        prisma.consumptionLog.create({
          data: {
            freezerId: ctx.product.freezerId,
            productId: ctx.product.id,
            name: ctx.product.name,
            category: ctx.product.category,
            kind: "WEIGHT",
            amount: weightAmount,
            unit: weightUnit,
          },
        }),
      ]);

      return NextResponse.json({
        product: toProductDTO(product),
        log: {
          id: log.id,
          amount: log.amount,
          unit: log.unit,
          kind: log.kind,
          consumedAt: log.consumedAt.toISOString(),
        },
      });
    }
  }

  // Altrimenti: consumo TOTALE (nessun amount/weightAmount, o quantità
  // richiesta pari o superiore a quella residua).
  const product = await prisma.product.update({
    where: { id },
    data: { status: "CONSUMED", consumedAt: new Date() },
  });
  return NextResponse.json({ product: toProductDTO(product) });
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
