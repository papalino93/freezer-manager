import { prisma } from "@/lib/prisma";

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
 * Elenca tutti i congelatori a cui l'utente ha accesso (propri e
 * condivisi con lui). La home mostra sempre tutto insieme (vista
 * unificata): non esiste più un singolo congelatore "attivo" da scegliere
 * per guardare i prodotti, solo per deciderne uno quando se ne aggiunge
 * uno nuovo.
 */
export async function listAccessibleFreezers(userId: string): Promise<FreezerSummary[]> {
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
    return [{ id, name: "Il mio congelatore", role: "OWNER" }];
  }

  // Per i congelatori condivisi con te, mostriamo "Congelatore di <nome>"
  // invece del nome generico "Il mio congelatore" (che è sempre lo stesso
  // per tutti): altrimenti la lista sarebbe illeggibile (punto 80).
  return memberships.map((m) => {
    if (m.role === "OWNER") return { id: m.freezerId, name: m.freezer.name, role: m.role };
    const ownerName = m.freezer.members[0]?.user.name;
    return {
      id: m.freezerId,
      name: ownerName ? `Congelatore di ${ownerName}` : "Congelatore condiviso",
      role: m.role,
    };
  });
}

/** Verifica che l'utente abbia accesso al congelatore indicato. */
export async function assertFreezerMember(userId: string, freezerId: string): Promise<boolean> {
  const membership = await prisma.freezerMember.findUnique({
    where: { freezerId_userId: { freezerId, userId } },
  });
  return Boolean(membership);
}

/** Verifica che l'utente sia il proprietario del congelatore indicato. */
export async function assertFreezerOwner(userId: string, freezerId: string): Promise<boolean> {
  const membership = await prisma.freezerMember.findUnique({
    where: { freezerId_userId: { freezerId, userId } },
  });
  return membership?.role === "OWNER";
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
  if (!(await assertFreezerOwner(userId, freezerId))) return false;

  await prisma.freezer.update({ where: { id: freezerId }, data: { name } });
  return true;
}

export interface FreezerMemberSummary {
  userId: string;
  name: string | null;
  email: string | null;
  role: "OWNER" | "MEMBER";
}

/** Elenca chi ha accesso a un congelatore (per farlo vedere al proprietario). */
export async function listFreezerMembers(freezerId: string): Promise<FreezerMemberSummary[]> {
  const members = await prisma.freezerMember.findMany({
    where: { freezerId },
    include: { user: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return members.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
  }));
}

/**
 * Rimuove un membro da un congelatore condiviso. Solo il proprietario può
 * farlo, e il proprietario stesso non può essere rimosso (dovrebbe
 * eliminare il congelatore, non "lasciarlo").
 */
export async function removeFreezerMember(
  freezerId: string,
  requesterId: string,
  targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await assertFreezerOwner(requesterId, freezerId))) {
    return { ok: false, error: "Solo chi ha creato il congelatore può rimuovere un membro." };
  }
  if (targetUserId === requesterId) {
    return { ok: false, error: "Il proprietario non può rimuovere se stesso." };
  }

  const { count } = await prisma.freezerMember.deleteMany({
    where: { freezerId, userId: targetUserId, role: "MEMBER" },
  });
  if (count === 0) {
    return { ok: false, error: "Membro non trovato." };
  }
  return { ok: true };
}

/**
 * Revoca il link di invito attuale: chi lo ha già in mano non può più
 * usarlo. Non tocca i membri già aggiunti (per quello c'è
 * removeFreezerMember). Solo il proprietario può farlo.
 */
export async function revokeFreezerInvite(
  freezerId: string,
  requesterId: string
): Promise<boolean> {
  if (!(await assertFreezerOwner(requesterId, freezerId))) return false;

  await prisma.freezerInvite.deleteMany({ where: { freezerId } });
  return true;
}
