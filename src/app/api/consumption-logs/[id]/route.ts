import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertFreezerMember } from "@/lib/freezer";
import { parseCountableQuantity, formatCountableQuantity } from "@/lib/countable-quantity";
import { parseWeightQuantity, formatWeightQuantity, toBaseValue } from "@/lib/weight-quantity";

type Context = { params: Promise<{ id: string }> };

const UNAUTHENTICATED = { error: NextResponse.json({ error: "Devi accedere per continuare." }, { status: 401 }) };
const NOT_FOUND = { error: NextResponse.json({ error: "Consumo non trovato." }, { status: 404 }) };
const QUANTITY_CHANGED = {
  error: NextResponse.json(
    { error: "La quantità del prodotto è cambiata: non posso ripristinarla automaticamente." },
    { status: 409 }
  ),
};

// Annulla un consumo PARZIALE (es. "ho consumato 1 scatola per sbaglio", o
// "300 g per sbaglio"): ripristina la quantità sul prodotto e toglie la
// riga dallo storico. Possibile solo finché il prodotto esiste ancora ed è
// tornato/rimasto ACTIVE con una quantità dello stesso tipo (numerabile o
// peso/volume) registrato nel log: se nel frattempo è stato cancellato,
// svuotato o la quantità è stata riscritta a mano in un formato diverso,
// non c'è più modo di sapere quanto riaggiungere e il consumo resta nello
// storico (niente cancellazioni silenziose).
export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return UNAUTHENTICATED.error;

  const log = await prisma.consumptionLog.findUnique({ where: { id } });
  if (!log) return NOT_FOUND.error;

  const allowed = await assertFreezerMember(userId, log.freezerId);
  if (!allowed) return NOT_FOUND.error; // non riveliamo che il consumo esiste in un altro congelatore

  if (!log.productId) {
    return NextResponse.json(
      { error: "Il prodotto è stato eliminato: non posso ripristinare la quantità." },
      { status: 409 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: log.productId } });
  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Il prodotto non è più disponibile: non posso ripristinare la quantità." },
      { status: 409 }
    );
  }

  let nextQuantity: string | null;
  if (log.kind === "WEIGHT") {
    const weight = parseWeightQuantity(product.quantity);
    if (!weight) return QUANTITY_CHANGED.error;
    const addBase = toBaseValue(log.amount, log.unit, weight.family);
    if (addBase === null) return QUANTITY_CHANGED.error;
    nextQuantity = formatWeightQuantity({ ...weight, valueBase: weight.valueBase + addBase });
  } else {
    const countable = parseCountableQuantity(product.quantity);
    if (!countable) return QUANTITY_CHANGED.error;
    nextQuantity = formatCountableQuantity({ ...countable, count: countable.count + log.amount });
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { quantity: nextQuantity } }),
    prisma.consumptionLog.delete({ where: { id } }),
  ]);

  return NextResponse.json({ quantity: updated.quantity });
}
