import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getActiveFreezer } from "@/lib/freezer";

export async function GET() {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const { freezerId, freezers } = await getActiveFreezer(ctx.userId);
  return NextResponse.json({ activeFreezerId: freezerId, freezers });
}
