import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveFreezer } from "@/lib/freezer";

/** Per le route che richiedono solo un utente loggato (es. le API AI). */
export async function requireSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      error: NextResponse.json({ error: "Devi accedere per continuare." }, { status: 401 }),
    } as const;
  }
  return { userId } as const;
}

/**
 * Helper comune per le API route: verifica la sessione e risolve il
 * congelatore attivo. Le route non devono duplicare questa logica.
 */
export async function requireActiveFreezer() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      error: NextResponse.json({ error: "Devi accedere per continuare." }, { status: 401 }),
    } as const;
  }

  const { freezerId } = await getActiveFreezer(userId);
  return { userId, freezerId } as const;
}
