"use client";

import { useEffect, useState } from "react";

interface Member {
  userId: string;
  name: string | null;
  email: string | null;
  role: "OWNER" | "MEMBER";
}

export function ShareHousehold({ householdId }: { householdId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function loadInvite() {
    return fetch(`/api/household/invite?householdId=${householdId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCode(data.code);
      })
      .catch(() => {});
  }

  function loadMembers() {
    fetch(`/api/household/members?householdId=${householdId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMembers(data.members);
      })
      .catch(() => {});
  }

  useEffect(() => {
    let ignore = false;
    loadInvite().then(() => {
      if (!ignore) loadMembers();
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  if (!code) return null;

  const url = `${window.location.origin}/invito/${code}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Ti invito ai miei congelatori su "Il Mio Congelatore" 🧊: ${url}`
  )}`;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function regenerateLink() {
    setRegenerating(true);
    await fetch(`/api/household/invite?householdId=${householdId}`, { method: "DELETE" });
    setCode(null);
    await loadInvite();
    setRegenerating(false);
  }

  async function removeMember(userId: string) {
    setRemovingId(userId);
    const res = await fetch(`/api/household/members/${userId}?householdId=${householdId}`, {
      method: "DELETE",
    });
    setRemovingId(null);
    if (res.ok) loadMembers();
  }

  const guests = members?.filter((m) => m.role !== "OWNER") ?? [];

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-sm text-muted">
        Chi apre questo link vedrà e potrà aggiungere prodotti in tutti i tuoi congelatori.
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
      <button
        type="button"
        disabled={regenerating}
        onClick={regenerateLink}
        className="tap-target self-start text-sm font-semibold text-muted hover:text-foreground disabled:opacity-60"
      >
        {regenerating ? "Genero un nuovo link…" : "🔄 Genera un nuovo link (quello vecchio smette di funzionare)"}
      </button>

      {guests.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
          <h3 className="text-sm font-bold text-foreground">Chi ha già accesso</h3>
          <ul className="flex flex-col gap-2">
            {guests.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-2 rounded-xl bg-background px-3 py-2"
              >
                <span className="truncate text-sm text-foreground">{m.name || m.email}</span>
                <button
                  type="button"
                  disabled={removingId === m.userId}
                  onClick={() => removeMember(m.userId)}
                  className="tap-target shrink-0 text-sm font-semibold text-rose-600 hover:underline disabled:opacity-60"
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
