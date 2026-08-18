import { NextRequest, NextResponse } from "next/server";

// Route diagnostica temporanea: da rimuovere subito dopo l'uso.
export async function GET(request: NextRequest) {
  try {
    const { handlers } = await import("@/lib/auth");
    const url = new URL("/api/auth/providers", request.url);
    const inner = new NextRequest(url, { headers: request.headers });
    const res = await handlers.GET(inner);
    const body = await res.text();
    return NextResponse.json({ status: res.status, body });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({
      message: e.message,
      stack: e.stack,
      name: e.name,
      cause: (e as { cause?: unknown }).cause,
    });
  }
}
