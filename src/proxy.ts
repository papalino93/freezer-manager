import { auth } from "@/lib/auth";

// Protegge tutte le pagine tranne login/registrazione, gli asset statici
// e le route dell'app router "speciali" (manifest, favicon, ecc.). Le API
// gestiscono l'autenticazione da sole (vedi src/lib/api-auth.ts), così un
// utente non loggato riceve un errore JSON pulito invece di un redirect.
export default auth;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|icon-192.png|icon-512.png|apple-icon.png|og-image.png|manifest.webmanifest|sw.js).*)",
  ],
};
