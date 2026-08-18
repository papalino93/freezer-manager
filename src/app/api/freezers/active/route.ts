import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/api-auth";
import { assertFreezerMember, ACTIVE_FREEZER_COOKIE } from "@/lib/freezer";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Cambia il congelatore attivo (selettore, visibile solo a chi ne ha più
// di uno). Salva la scelta in un cookie così resta valida tra le visite.
export async function POST(request: NextRequest) {
  const ctx = await requireSession();
  if ("error" in ctx) return ctx.error;

  const body = await request.json().catch(() => null);
  const freezerId = typeof body?.freezerId === "string" ? body.freezerId : null;
  if (!freezerId) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const allowed = await assertFreezerMember(ctx.userId, freezerId);
  if (!allowed) {
    return NextResponse.json({ error: "Non hai accesso a questo congelatore." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FREEZER_COOKIE, freezerId, {
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
