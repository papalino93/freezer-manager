"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/Logo";

type Mode = "login" | "register";

function getNextUrl(): string {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  // Il middleware di Auth.js (src/proxy.ts) reindirizza qui con
  // "callbackUrl" quando blocca una pagina protetta (es. un link di
  // invito): "next" resta come alias per eventuali link scritti a mano.
  return params.get("callbackUrl") || params.get("next") || "/";
}

export function AccediForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    await signIn("google", { callbackUrl: getNextUrl() });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Qualcosa è andato storto. Riprova.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email o password non corretti.");
        setLoading(false);
        return;
      }
      router.push(getNextUrl());
      router.refresh();
    } catch {
      setError("Qualcosa è andato storto. Riprova.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-2 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="h-20 w-20" />
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Benvenuto nel tuo congelatore.
          </h1>
          <p className="mt-1 text-muted">
            Accedi per vedere sempre cosa hai nel congelatore.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-5">
        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              className="tap-target flex items-center justify-center gap-3 rounded-full border border-border bg-surface px-5 py-4 text-base font-bold text-foreground shadow-sm hover:shadow-md"
            >
              <GoogleIcon />
              Entra con Google
            </button>

            <div className="flex items-center gap-3 text-xs font-semibold uppercase text-muted">
              <span className="h-px flex-1 bg-border" />
              oppure
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Il tuo nome"
              aria-label="Il tuo nome"
              autoComplete="name"
              className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-brand"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-brand"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            className="tap-target w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-brand"
          />

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="tap-target rounded-full bg-brand px-5 py-3 text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Un attimo…" : mode === "register" ? "Crea il tuo account" : "Accedi"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="tap-target text-sm font-semibold text-brand-dark hover:underline"
        >
          {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.5 2.5-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.8 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.5l6.5 5.5C41.5 36 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
