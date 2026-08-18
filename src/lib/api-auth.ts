import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertFreezerMember, listAccessibleFreezers } from "@/lib/freezer";

const UNAUTHENTICATED = {
  error: NextResponse.json({ error: "Devi accedere per continuare." }, { status: 401 }),
} as const;

const NOT_FOUND = {
  error: NextResponse.json({ error: "Prodotto non trovato." }, { status: 404 }),
} as const;

/** Per le route che richiedono solo un utente loggato (es. le API AI). */
export async function requireSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return UNAUTHENTICATED;
  return { userId } as const;
}

/**
 * Helper comune per le route che leggono/aggregano su tutti i congelatori
 * dell'utente (vista unificata): home, riepilogo, elenco prodotti.
 */
export async function requireAccessibleFreezers() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return UNAUTHENTICATED;

  const freezers = await listAccessibleFreezers(userId);
  return { userId, freezers, freezerIds: freezers.map((f) => f.id) } as const;
}

/**
 * Per le route su un singolo prodotto (GET/PATCH/DELETE/consuma): il
 * prodotto può stare in uno qualsiasi dei congelatori dell'utente, quindi
 * si risale al congelatore dal prodotto stesso invece che da un
 * congelatore "attivo".
 */
export async function requireProductAccess(productId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return UNAUTHENTICATED;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NOT_FOUND;

  const allowed = await assertFreezerMember(userId, product.freezerId);
  if (!allowed) return NOT_FOUND; // non riveliamo che il prodotto esiste in un altro congelatore

  return { userId, product } as const;
}
