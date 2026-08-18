import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { assertHouseholdOwner, listHouseholdMembers } from "@/lib/freezer";

// Elenca chi ha accesso al profilo indicato (?householdId=). Solo il
// proprietario: agli altri membri non serve gestire la condivisione.
export async function GET(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const householdId = request.nextUrl.searchParams.get("householdId");
  if (!householdId || !(await assertHouseholdOwner(ctx.userId, householdId))) {
    return NextResponse.json({ members: [] });
  }

  const members = await listHouseholdMembers(householdId);
  return NextResponse.json({ members });
}
