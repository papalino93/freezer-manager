import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { assertFreezerOwner, listFreezerMembers } from "@/lib/freezer";

// Elenca chi ha accesso al congelatore indicato (?freezerId=). Solo il
// proprietario: agli altri membri non serve gestire la condivisione.
export async function GET(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const freezerId = request.nextUrl.searchParams.get("freezerId");
  if (!freezerId || !(await assertFreezerOwner(ctx.userId, freezerId))) {
    return NextResponse.json({ members: [] });
  }

  const members = await listFreezerMembers(freezerId);
  return NextResponse.json({ members });
}
