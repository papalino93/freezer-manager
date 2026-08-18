import { NextResponse } from "next/server";
import { requireActiveFreezer } from "@/lib/api-auth";
import { assertFreezerOwner, listFreezerMembers } from "@/lib/freezer";

// Elenca chi ha accesso al congelatore attivo. Solo il proprietario: agli
// altri membri non serve gestire la condivisione.
export async function GET() {
  const ctx = await requireActiveFreezer();
  if ("error" in ctx) return ctx.error;

  if (!(await assertFreezerOwner(ctx.userId, ctx.freezerId))) {
    return NextResponse.json({ members: [] });
  }

  const members = await listFreezerMembers(ctx.freezerId);
  return NextResponse.json({ members });
}
