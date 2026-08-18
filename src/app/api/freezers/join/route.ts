import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { ACTIVE_FREEZER_COOKIE } from "@/lib/freezer";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Unisce l'utente loggato al congelatore corrispondente al codice di
// invito, e lo rende subito il congelatore attivo.
export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : null;
  if (!code) {
    return NextResponse.json({ error: "Codice non valido." }, { status: 400 });
  }

  const invite = await prisma.freezerInvite.findUnique({ where: { code } });
  if (!invite) {
    return NextResponse.json(
      { error: "Questo link di invito non è valido o non esiste più." },
      { status: 404 }
    );
  }

  await prisma.freezerMember.upsert({
    where: { freezerId_userId: { freezerId: invite.freezerId, userId: ctx.userId } },
    create: { freezerId: invite.freezerId, userId: ctx.userId, role: "MEMBER" },
    update: {},
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FREEZER_COOKIE, invite.freezerId, {
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
