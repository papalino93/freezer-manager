import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensurePersonalFreezer } from "@/lib/freezer";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @auth/prisma-adapter è ancora tipizzato per il vecchio pacchetto
  // "@prisma/client": il nostro client (generato con l'output custom di
  // Prisma 7) espone esattamente le stesse delegate (user, account,
  // session, verificationToken), quindi è compatibile a runtime: il cast
  // serve solo ad aggirare il mismatch di tipi tra i due pacchetti.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  // Il dominio *.vercel.app non è "canonico" agli occhi di Auth.js: senza
  // questo flag ogni richiesta fallisce con UntrustedHost (punto scoperto
  // in produzione, non solo in locale).
  trustHost: true,
  session: { strategy: "jwt", maxAge: ONE_YEAR },
  pages: { signIn: "/accedi" },
  providers: [
    ...(isGoogleConfigured ? [Google] : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    authorized({ request, auth: session }) {
      const { pathname } = request.nextUrl;
      const isPublic = pathname.startsWith("/accedi") || pathname.startsWith("/api/auth");
      return isPublic || Boolean(session?.user);
    },
  },
  events: {
    // Creato solo per il login Google (il login email/password crea
    // l'utente altrove, nella route di registrazione).
    async createUser({ user }) {
      if (user.id) await ensurePersonalFreezer(user.id);
    },
  },
});
