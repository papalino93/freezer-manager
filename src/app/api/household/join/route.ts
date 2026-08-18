import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// Unisce l'utente loggato al profilo corrispondente al codice di invito:
// vedrà tutti i congelatori di quella persona, non solo uno.
export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : null;
  if (!code) {
    return NextResponse.json({ error: "Codice non valido." }, { status: 400 });
  }

  const invite = await prisma.householdInvite.findUnique({ where: { code } });
  if (!invite) {
    return NextResponse.json(
      { error: "Questo link di invito non è valido o non esiste più." },
      { status: 404 }
    );
  }

  await prisma.householdMember.upsert({
    where: { householdId_userId: { householdId: invite.householdId, userId: ctx.userId } },
    create: { householdId: invite.householdId, userId: ctx.userId, role: "MEMBER" },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
