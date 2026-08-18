import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_FREEZER_COOKIE = "activeFreezerId";

/**
 * Crea il congelatore personale di un utente al primo accesso, se non ne
 * ha già uno di sua proprietà. Idempotente: chiamarla più volte è sicuro.
 */
export async function ensurePersonalFreezer(userId: string) {
  const existing = await prisma.freezerMember.findFirst({
    where: { userId, role: "OWNER" },
  });
  if (existing) return existing.freezerId;

  const freezer = await prisma.freezer.create({
    data: {
      name: "Il mio congelatore",
      members: { create: { userId, role: "OWNER" } },
    },
  });
  return freezer.id;
}

export interface FreezerSummary {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

/**
 * Determina su quale congelatore l'utente sta operando in questa
 * richiesta: quello scelto dal selettore (cookie) se ne ha più di uno,
 * altrimenti l'unico che possiede. Ritorna anche l'elenco di tutti i
 * congelatori a cui ha accesso, per decidere se mostrare il selettore.
 */
export async function getActiveFreezer(userId: string): Promise<{
  freezerId: string;
  freezers: FreezerSummary[];
}> {
  const memberships = await prisma.freezerMember.findMany({
    where: { userId },
    include: {
      freezer: {
        include: { members: { where: { role: "OWNER" }, include: { user: true } } },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  if (memberships.length === 0) {
    const id = await ensurePersonalFreezer(userId);
    return {
      freezerId: id,
      freezers: [{ id, name: "Il mio congelatore", role: "OWNER" }],
    };
  }

  // Per i congelatori condivisi con te, mostriamo "Congelatore di <nome>"
  // invece del nome generico "Il mio congelatore" (che è sempre lo stesso
  // per tutti): altrimenti il selettore sarebbe illeggibile (punto 80).
  const freezers: FreezerSummary[] = memberships.map((m) => {
    if (m.role === "OWNER") return { id: m.freezerId, name: m.freezer.name, role: m.role };
    const ownerName = m.freezer.members[0]?.user.name;
    return {
      id: m.freezerId,
      name: ownerName ? `Congelatore di ${ownerName}` : "Congelatore condiviso",
      role: m.role,
    };
  });

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_FREEZER_COOKIE)?.value;
  const match = preferred && freezers.find((f) => f.id === preferred);

  const own = freezers.find((f) => f.role === "OWNER");
  const freezerId = match ? match.id : (own ?? freezers[0]).id;

  return { freezerId, freezers };
}

/** Verifica che l'utente abbia accesso al congelatore indicato. */
export async function assertFreezerMember(userId: string, freezerId: string): Promise<boolean> {
  const membership = await prisma.freezerMember.findUnique({
    where: { freezerId_userId: { freezerId, userId } },
  });
  return Boolean(membership);
}

/**
 * Crea un congelatore aggiuntivo di proprietà dell'utente (es. "Cucina" e
 * "Cantina" nella stessa casa): a differenza di ensurePersonalFreezer, qui
 * un secondo congelatore è il punto, non un caso da evitare.
 */
export async function createOwnedFreezer(userId: string, name: string): Promise<FreezerSummary> {
  const freezer = await prisma.freezer.create({
    data: {
      name,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  return { id: freezer.id, name: freezer.name, role: "OWNER" };
}

/** Rinomina un congelatore. Richiede che l'utente ne sia il proprietario. */
export async function renameFreezer(
  freezerId: string,
  userId: string,
  name: string
): Promise<boolean> {
  const membership = await prisma.freezerMember.findUnique({
    where: { freezerId_userId: { freezerId, userId } },
  });
  if (membership?.role !== "OWNER") return false;

  await prisma.freezer.update({ where: { id: freezerId }, data: { name } });
  return true;
}
