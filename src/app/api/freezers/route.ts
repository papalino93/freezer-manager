import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { createOwnedFreezer, listAccessibleFreezers } from "@/lib/freezer";

export async function GET() {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const freezers = await listAccessibleFreezers(ctx.userId);
  return NextResponse.json({ freezers });
}

const freezerNameSchema = z.object({
  name: z.string().trim().min(1, "Serve almeno un nome").max(60),
});

// Crea un congelatore aggiuntivo di proprietà dell'utente, per chi ne ha
// più di uno in casa (es. "Cucina" e "Cantina").
export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  const parsed = freezerNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Serve un nome per il congelatore." }, { status: 400 });
  }

  const freezer = await createOwnedFreezer(ctx.userId, parsed.data.name);
  return NextResponse.json({ freezer }, { status: 201 });
}
