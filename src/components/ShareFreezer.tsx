"use client";

import { useEffect, useState } from "react";

export function ShareFreezer() {
  const [code, setCode] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/freezers/invite")
      .then(async (res) => {
        if (ignore) return;
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setCode(data.code);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  if (forbidden) {
    // Solo il proprietario del congelatore attivo può condividerlo:
    // per chi è già "ospite" non mostriamo affatto la sezione.
    return null;
  }

  if (!code) return null;

  const url = `${window.location.origin}/invito/${code}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Ti invito al mio congelatore su "Il Mio Congelatore" 🧊: ${url}`
  )}`;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-lg font-extrabold text-foreground">🤝 Condividi questo congelatore</h2>
      <p className="text-sm text-muted">
        Chi apre questo link potrà vedere e aggiungere prodotti in questo congelatore.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="tap-target flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          Invia su WhatsApp
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="tap-target flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-surface"
        >
          {copied ? "✓ Copiato" : "Copia link"}
        </button>
      </div>
    </section>
  );
}
