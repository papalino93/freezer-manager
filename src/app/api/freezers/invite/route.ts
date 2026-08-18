import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { assertFreezerOwner, revokeFreezerInvite } from "@/lib/freezer";

function generateCode(): string {
  return randomBytes(6).toString("base64url"); // ~8 caratteri, url-safe
}

// Restituisce il codice di invito del congelatore indicato (?freezerId=),
// creandolo se non esiste ancora. Solo il proprietario può condividere
// (punto 80).
export async function GET(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const freezerId = request.nextUrl.searchParams.get("freezerId");
  if (!freezerId || !(await assertFreezerOwner(ctx.userId, freezerId))) {
    return NextResponse.json(
      { error: "Solo chi ha creato il congelatore può condividerlo." },
      { status: 403 }
    );
  }

  let invite = await prisma.freezerInvite.findFirst({ where: { freezerId } });
  if (!invite) {
    invite = await prisma.freezerInvite.create({
      data: { freezerId, code: generateCode() },
    });
  }

  return NextResponse.json({ code: invite.code });
}

// Revoca il link di invito attuale: chi lo aveva in mano non può più
// usarlo per unirsi. Un nuovo GET ne crea uno nuovo.
export async function DELETE(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const freezerId = request.nextUrl.searchParams.get("freezerId");
  const ok = freezerId && (await revokeFreezerInvite(freezerId, ctx.userId));
  if (!ok) {
    return NextResponse.json(
      { error: "Solo chi ha creato il congelatore può revocare l'invito." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
