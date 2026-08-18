import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { assertHouseholdOwner, revokeHouseholdInvite } from "@/lib/freezer";

function generateCode(): string {
  return randomBytes(6).toString("base64url"); // ~8 caratteri, url-safe
}

// Restituisce il codice di invito del profilo indicato (?householdId=),
// creandolo se non esiste ancora. Chi lo usa vede TUTTI i congelatori del
// profilo. Solo il proprietario può condividere (punto 80).
export async function GET(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const householdId = request.nextUrl.searchParams.get("householdId");
  if (!householdId || !(await assertHouseholdOwner(ctx.userId, householdId))) {
    return NextResponse.json(
      { error: "Solo chi ha creato il profilo può condividerlo." },
      { status: 403 }
    );
  }

  let invite = await prisma.householdInvite.findFirst({ where: { householdId } });
  if (!invite) {
    invite = await prisma.householdInvite.create({
      data: { householdId, code: generateCode() },
    });
  }

  return NextResponse.json({ code: invite.code });
}

// Revoca il link di invito attuale: chi lo aveva in mano non può più
// usarlo per unirsi. Un nuovo GET ne crea uno nuovo.
export async function DELETE(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const householdId = request.nextUrl.searchParams.get("householdId");
  const ok = householdId && (await revokeHouseholdInvite(householdId, ctx.userId));
  if (!ok) {
    return NextResponse.json(
      { error: "Solo chi ha creato il profilo può revocare l'invito." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
