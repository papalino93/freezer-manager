import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { removeHouseholdMember } from "@/lib/freezer";

type Context = { params: Promise<{ userId: string }> };

// Rimuove un membro dal profilo indicato (?householdId=): perde l'accesso
// a tutti i suoi congelatori. Solo il proprietario.
export async function DELETE(request: NextRequest, { params }: Context) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const householdId = request.nextUrl.searchParams.get("householdId");
  if (!householdId) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { userId: targetUserId } = await params;
  const result = await removeHouseholdMember(householdId, ctx.userId, targetUserId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
