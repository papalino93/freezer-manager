import { NextResponse } from "next/server";
import { requireActiveFreezer } from "@/lib/api-auth";
import { removeFreezerMember } from "@/lib/freezer";

type Context = { params: Promise<{ userId: string }> };

// Rimuove un membro dal congelatore condiviso attivo. Solo il proprietario.
export async function DELETE(_request: Request, { params }: Context) {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  const { userId: targetUserId } = await params;
  const result = await removeFreezerMember(ctx.freezerId, ctx.userId, targetUserId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
