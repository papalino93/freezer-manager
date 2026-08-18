import { NextRequest, NextResponse } from "next/server";

// Route diagnostica temporanea: da rimuovere subito dopo l'uso.
export async function GET(request: NextRequest) {
  const { handlers, lastAuthError } = await import("@/lib/auth");
  lastAuthError.value = null;
  const url = new URL("/api/auth/providers", request.url);
  const inner = new NextRequest(url, { headers: request.headers });
  const res = await handlers.GET(inner);
  const body = await res.text();
  return NextResponse.json({
    status: res.status,
    body,
    lastAuthError: lastAuthError.value,
    // Solo presenza/lunghezza: mai il valore reale.
    envCheck: {
      AUTH_SECRET: { present: "AUTH_SECRET" in process.env, length: process.env.AUTH_SECRET?.length ?? 0 },
      AUTH_GOOGLE_ID: { present: "AUTH_GOOGLE_ID" in process.env, length: process.env.AUTH_GOOGLE_ID?.length ?? 0 },
      DATABASE_URL: { present: "DATABASE_URL" in process.env, length: process.env.DATABASE_URL?.length ?? 0 },
    },
  });
}
