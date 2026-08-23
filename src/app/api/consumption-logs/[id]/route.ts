import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertFreezerMember } from "@/lib/freezer";
import { parseCountableQuantity, formatCountableQuantity } from "@/lib/countable-quantity";

type Context = { params: Promise<{ id: string }> };

const UNAUTHENTICATED = { error: NextResponse.json({ error: "Devi accedere per continuare." }, { status: 401 }) };
const NOT_FOUND = { error: NextResponse.json({ error: "Consumo non trovato." }, { status: 404 }) };

// Annulla un consumo PARZIALE (es. "ho consumato 1 scatola per sbaglio"):
// ripristina la quantità sul prodotto e toglie la riga dallo storico.
// Possibile solo finché il prodotto esiste ancora ed è tornato/rimasto
// ACTIVE con una quantità numerabile: se nel frattempo è stato cancellato
// del tutto o svuotato, non c'è più nulla a cui riaggiungere la quantità
// e il consumo resta nello storico (niente cancellazioni silenziose).
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

  const countable = parseCountableQuantity(product.quantity);
  if (!countable) {
    // La quantità non è più "numerabile" (es. il prodotto è stato
    // modificato a mano nel frattempo, "1 kg" invece di "4 scatole"): non
    // c'è più modo di sapere quanto riaggiungere. Meglio rifiutare che
    // cancellare la riga di storico senza ripristinare nulla.
    return NextResponse.json(
      { error: "La quantità del prodotto è cambiata: non posso ripristinarla automaticamente." },
      { status: 409 }
    );
  }
  const nextQuantity = formatCountableQuantity({ ...countable, count: countable.count + log.amount });

  const [updated] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { quantity: nextQuantity } }),
    prisma.consumptionLog.delete({ where: { id } }),
  ]);

  return NextResponse.json({ quantity: updated.quantity });
}
