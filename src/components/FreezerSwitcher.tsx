"use client";

import { useEffect, useState } from "react";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

// Selettore del congelatore attivo. Deve comparire SOLO se l'utente ha
// accesso a più di un congelatore (punto 80): per chi ne ha uno solo,
// niente menu, niente scelta, per non confondere.
export function FreezerSwitcher() {
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (ignore || !data) return;
        setFreezers(data.freezers);
        setActiveId(data.activeFreezerId);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  async function handleChange(freezerId: string) {
    setSwitching(true);
    const res = await fetch("/api/freezers/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freezerId }),
    });
    if (res.ok) {
      // Ricarica tutta la pagina (non una navigazione SPA): è il modo
      // sicuro per essere certi che ogni componente rilegga i dati del
      // nuovo congelatore attivo, cambiato lato server via cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
      return;
    }
    setSwitching(false);
  }

  if (!freezers || freezers.length <= 1) return null;

  return (
    <select
      value={activeId ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      disabled={switching}
      aria-label="Congelatore"
      className="tap-target w-full max-w-full truncate rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground sm:w-auto"
    >
      {freezers.map((f) => (
        <option key={f.id} value={f.id}>
          {f.role === "OWNER" ? "🧊" : "👥"} {f.name}
        </option>
      ))}
    </select>
  );
}
