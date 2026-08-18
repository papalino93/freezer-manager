import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireActiveFreezer } from "@/lib/api-auth";

function generateCode(): string {
  return randomBytes(6).toString("base64url"); // ~8 caratteri, url-safe
}

// Restituisce il codice di invito del congelatore attivo, creandolo se non
// esiste ancora. Solo il proprietario può condividere (punto 80).
export async function GET() {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const membership = await prisma.freezerMember.findUnique({
    where: { freezerId_userId: { freezerId: ctx.freezerId, userId: ctx.userId } },
  });
  if (membership?.role !== "OWNER") {
    return NextResponse.json(
      { error: "Solo chi ha creato il congelatore può condividerlo." },
      { status: 403 }
    );
  }

  let invite = await prisma.freezerInvite.findFirst({ where: { freezerId: ctx.freezerId } });
  if (!invite) {
    invite = await prisma.freezerInvite.create({
      data: { freezerId: ctx.freezerId, code: generateCode() },
    });
  }

  return NextResponse.json({ code: invite.code });
}
