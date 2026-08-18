"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const APP_NAME = "Il Mio Congelatore";
const AUTH_PATHS = ["/accedi", "/registrati", "/invito"];

export function AppHeader() {
  const pathname = usePathname();
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 tap-target" aria-label={APP_NAME}>
          <Logo className="h-9 w-9 shrink-0" />
          <span className="hidden text-lg font-extrabold text-foreground sm:inline">
            {APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/storico"
            className="tap-target flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground"
          >
            <span aria-hidden>🕘</span>
            <span className="hidden sm:inline">Storico</span>
          </Link>
          <Link
            href="/impostazioni"
            aria-label="Impostazioni"
            className="tap-target flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-surface hover:text-foreground"
          >
            <span aria-hidden>⚙️</span>
            <span className="hidden sm:inline">Impostazioni</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
