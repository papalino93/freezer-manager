import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getOwnedHousehold, renameHousehold } from "@/lib/freezer";

// Il profilo (nome + id) di proprietà dell'utente: raggruppa tutti i suoi
// congelatori sotto un unico nome condivisibile (es. "I congelatori di
// Carla").
export async function GET() {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const household = await getOwnedHousehold(ctx.userId);
  return NextResponse.json({ household });
}

const nameSchema = z.object({
  name: z.string().trim().min(1, "Serve almeno un nome").max(60),
});

export async function PATCH(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  const parsed = nameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Serve un nome per il profilo." }, { status: 400 });
  }

  const ok = await renameHousehold(ctx.userId, parsed.data.name);
  if (!ok) {
    return NextResponse.json({ error: "Profilo non trovato." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
