import { NextRequest, NextResponse } from "next/server";

// Route diagnostica temporanea: da rimuovere subito dopo l'uso.
export async function GET(request: NextRequest) {
  const { handlers, lastAuthError } = await import("@/lib/auth");
  lastAuthError.value = null;
  const url = new URL("/api/auth/providers", request.url);
  const inner = new NextRequest(url, { headers: request.headers });
  const res = await handlers.GET(inner);
  const body = await res.text();
  return NextResponse.json({ status: res.status, body, lastAuthError: lastAuthError.value });
}
