import { NextResponse } from "next/server";

// Route diagnostica temporanea: da rimuovere subito dopo l'uso.
export async function GET() {
  try {
    await import("@/lib/auth");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({
      message: e.message,
      stack: e.stack,
      name: e.name,
    });
  }
}
