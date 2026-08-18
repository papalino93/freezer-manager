import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { renameFreezer } from "@/lib/freezer";

const freezerNameSchema = z.object({
  name: z.string().trim().min(1, "Serve almeno un nome").max(60),
});

// Rinomina un congelatore (es. "Il mio congelatore" -> "Cucina"). Solo il
// proprietario può farlo.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = freezerNameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Serve un nome per il congelatore." }, { status: 400 });
  }

  const ok = await renameFreezer(id, ctx.userId, parsed.data.name);
  if (!ok) {
    return NextResponse.json(
      { error: "Solo chi ha creato il congelatore può rinominarlo." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
