import { prisma } from "@/lib/prisma";

export interface FreezerSummary {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export interface HouseholdSummary {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export interface HouseholdMemberSummary {
  userId: string;
  name: string | null;
  email: string | null;
  role: "OWNER" | "MEMBER";
}

async function defaultHouseholdName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.name ? `I congelatori di ${user.name}` : "I miei congelatori";
}

/**
 * Crea il profilo personale di un utente al primo accesso, se non ne ha
 * già uno di sua proprietà: un Household con dentro un congelatore.
 * Idempotente: chiamarla più volte è sicuro.
 */
export async function ensurePersonalHousehold(userId: string): Promise<string> {
  const existing = await prisma.householdMember.findFirst({
    where: { userId, role: "OWNER" },
  });
  if (existing) return existing.householdId;

  const name = await defaultHouseholdName(userId);

  return prisma.$transaction(async (tx) => {
    // Due richieste per lo stesso utente potrebbero arrivare qui insieme
    // (es. home page che chiama /api/products e /api/freezers in parallelo
    // al primissimo accesso): un lock per-utente evita che entrambe creino
    // un profilo personale duplicato.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const existingAfterLock = await tx.householdMember.findFirst({
      where: { userId, role: "OWNER" },
    });
    if (existingAfterLock) return existingAfterLock.householdId;

    const household = await tx.household.create({
      data: {
        name,
        members: { create: { userId, role: "OWNER" } },
        freezers: { create: { name: "Il mio congelatore" } },
      },
    });
    return household.id;
  });
}

/**
 * Elenca tutti i congelatori a cui l'utente ha accesso, propri e di
 * profili condivisi con lui: si condivide un profilo intero (tutti i suoi
 * congelatori insieme), non un congelatore alla volta. La home mostra
 * sempre tutto insieme (vista unificata).
 */
export async function listAccessibleFreezers(userId: string): Promise<FreezerSummary[]> {
  const memberships = await prisma.householdMember.findMany({
    where: { userId },
    include: {
      household: {
        include: {
          freezers: { orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  if (memberships.length === 0) {
    await ensurePersonalHousehold(userId);
    return listAccessibleFreezers(userId);
  }

  const result: FreezerSummary[] = [];
  for (const m of memberships) {
    if (m.role === "OWNER") {
      for (const f of m.household.freezers) {
        result.push({ id: f.id, name: f.name, role: "OWNER" });
      }
      continue;
    }
    // Per i profili condivisi con te, il nome del congelatore da solo non
    // basterebbe a capire di chi è: aggiungiamo il nome del profilo, così
    // se il proprietario lo rinomina (es. "Casa al mare") lo vedi anche tu
    // (punto audit #4).
    for (const f of m.household.freezers) {
      result.push({ id: f.id, name: `${m.household.name} — ${f.name}`, role: "MEMBER" });
    }
  }
  return result;
}

/** Il profilo (Household) di proprietà dell'utente, se ne ha già uno. */
export async function getOwnedHousehold(userId: string): Promise<HouseholdSummary | null> {
  const membership = await prisma.householdMember.findFirst({
    where: { userId, role: "OWNER" },
    include: { household: true },
  });
  if (!membership) return null;
  return { id: membership.householdId, name: membership.household.name, role: "OWNER" };
}

/** Rinomina il profilo di proprietà dell'utente (es. "I congelatori di Carla"). */
export async function renameHousehold(userId: string, name: string): Promise<boolean> {
  const membership = await prisma.householdMember.findFirst({
    where: { userId, role: "OWNER" },
  });
  if (!membership) return false;

  await prisma.household.update({ where: { id: membership.householdId }, data: { name } });
  return true;
}

/** Verifica che l'utente abbia accesso al congelatore indicato. */
export async function assertFreezerMember(userId: string, freezerId: string): Promise<boolean> {
  const freezer = await prisma.freezer.findUnique({
    where: { id: freezerId },
    select: { householdId: true },
  });
  if (!freezer) return false;

  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: freezer.householdId, userId } },
  });
  return Boolean(membership);
}

/** Verifica che l'utente sia il proprietario del profilo a cui appartiene il congelatore. */
export async function assertFreezerOwner(userId: string, freezerId: string): Promise<boolean> {
  const freezer = await prisma.freezer.findUnique({
    where: { id: freezerId },
    select: { householdId: true },
  });
  if (!freezer) return false;

  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId: freezer.householdId, userId } },
  });
  return membership?.role === "OWNER";
}

/** Verifica che l'utente sia il proprietario del profilo indicato. */
export async function assertHouseholdOwner(userId: string, householdId: string): Promise<boolean> {
  const membership = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  return membership?.role === "OWNER";
}

/**
 * Crea un congelatore aggiuntivo nel profilo dell'utente (es. "Cucina" e
 * "Cantina" nella stessa casa): a differenza di ensurePersonalHousehold,
 * qui un secondo congelatore è il punto, non un caso da evitare.
 */
export async function createOwnedFreezer(userId: string, name: string): Promise<FreezerSummary> {
  const householdId = await ensurePersonalHousehold(userId);
  const freezer = await prisma.freezer.create({ data: { householdId, name } });
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

/**
 * Elimina un congelatore. Non esisteva alcun modo di farlo: uno creato per
 * sbaglio restava per sempre, comparendo anche nella scelta "dove lo stai
 * mettendo?" (punto segnalato dall'utente). Bloccata in due casi, per non
 * perdere dati senza preavviso:
 * - è l'unico congelatore rimasto nel profilo (il profilo deve poterne
 *   sempre offrire almeno uno);
 * - contiene ancora prodotti, anche solo nello storico dei consumati: la
 *   riga sul Freezer è "onDelete: Cascade", quindi eliminarlo li
 *   cancellerebbe silenziosamente insieme a lui.
 */
export async function deleteFreezer(
  freezerId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await assertFreezerOwner(userId, freezerId))) {
    return { ok: false, error: "Solo chi ha creato il congelatore può eliminarlo." };
  }

  const freezer = await prisma.freezer.findUnique({
    where: { id: freezerId },
    select: { householdId: true },
  });
  if (!freezer) {
    return { ok: false, error: "Congelatore non trovato." };
  }

  const [siblingCount, productCount] = await Promise.all([
    prisma.freezer.count({ where: { householdId: freezer.householdId } }),
    prisma.product.count({ where: { freezerId } }),
  ]);

  if (siblingCount <= 1) {
    return { ok: false, error: "Non puoi eliminare l'unico congelatore rimasto in questo profilo." };
  }
  if (productCount > 0) {
    return {
      ok: false,
      error: `Contiene ancora ${productCount} ${productCount === 1 ? "prodotto" : "prodotti"} (anche nello storico): spostali o eliminali prima.`,
    };
  }

  await prisma.freezer.delete({ where: { id: freezerId } });
  return { ok: true };
}

/** Elenca chi ha accesso a un profilo (per farlo vedere al proprietario). */
export async function listHouseholdMembers(householdId: string): Promise<HouseholdMemberSummary[]> {
  const members = await prisma.householdMember.findMany({
    where: { householdId },
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
 * Rimuove un membro da un profilo condiviso (perde l'accesso a tutti i
 * suoi congelatori). Solo il proprietario può farlo, e il proprietario
 * stesso non può essere rimosso (dovrebbe eliminare il profilo, non
 * "lasciarlo").
 */
export async function removeHouseholdMember(
  householdId: string,
  requesterId: string,
  targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await assertHouseholdOwner(requesterId, householdId))) {
    return { ok: false, error: "Solo chi ha creato il profilo può rimuovere un membro." };
  }
  if (targetUserId === requesterId) {
    return { ok: false, error: "Il proprietario non può rimuovere se stesso." };
  }

  const { count } = await prisma.householdMember.deleteMany({
    where: { householdId, userId: targetUserId, role: "MEMBER" },
  });
  if (count === 0) {
    return { ok: false, error: "Membro non trovato." };
  }
  return { ok: true };
}

/**
 * Revoca il link di invito attuale del profilo: chi lo ha già in mano non
 * può più usarlo. Non tocca i membri già aggiunti (per quello c'è
 * removeHouseholdMember). Solo il proprietario può farlo.
 */
export async function revokeHouseholdInvite(
  householdId: string,
  requesterId: string
): Promise<boolean> {
  if (!(await assertHouseholdOwner(requesterId, householdId))) return false;

  await prisma.householdInvite.deleteMany({ where: { householdId } });
  return true;
}
