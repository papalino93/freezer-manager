import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ensurePersonalHousehold } from "@/lib/freezer";

function emailTakenResponse() {
  return NextResponse.json(
    { error: "Esiste già un account con questa email. Prova ad accedere." },
    { status: 409 }
  );
}

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

// Registrazione con email/password. Il login vero e proprio avviene dopo,
// tramite il provider Credentials (che verifica solo, non crea utenti).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Controlla il nome, l'email e la password (almeno 8 caratteri)." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return emailTakenResponse();
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let user;
  try {
    user = await prisma.user.create({
      data: { name: parsed.data.name, email, passwordHash },
    });
  } catch (err) {
    // Due registrazioni con la stessa email quasi in contemporanea (due
    // schede, o un doppio tap) possono superare entrambe il controllo qui
    // sopra prima che l'una o l'altra scriva: il vincolo di unicità del
    // database resta l'ultima parola, qui la traduciamo in un messaggio
    // comprensibile invece di un errore generico.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return emailTakenResponse();
    }
    throw err;
  }
  await ensurePersonalHousehold(user.id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
