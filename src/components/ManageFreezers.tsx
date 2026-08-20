"use client";

import { useEffect, useRef, useState } from "react";
import { ShareHousehold } from "@/components/ShareHousehold";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

interface Household {
  id: string;
  name: string;
}

// Gestione del profilo di proprietà: nome condivisibile (es. "I
// congelatori di Carla") e i congelatori al suo interno. Chi ne ha più
// d'uno in casa (es. cucina e cantina) può crearli qui e dargli un nome,
// invece di ritrovarsi solo con l'unico congelatore personale automatico.
export function ManageFreezers() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);
  const [renamingHousehold, setRenamingHousehold] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  // Evita il doppio invio: disabilitare l'input dopo l'Invio forza un
  // blur, che altrimenti farebbe scattare handleRename una seconda volta.
  const renameSubmittedRef = useRef(false);
  const renameHouseholdSubmittedRef = useRef(false);
  const createSubmittedRef = useRef(false);

  function load() {
    fetch("/api/household")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setHousehold(data.household);
      })
      .catch(() => {});
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFreezers(data.freezers);
      })
      .catch(() => {});
  }

  useEffect(load, []);

  const owned = freezers?.filter((f) => f.role === "OWNER") ?? null;

  async function handleRenameHousehold(name: string) {
    if (renameHouseholdSubmittedRef.current) return;
    renameHouseholdSubmittedRef.current = true;

    const trimmed = name.trim();
    if (!trimmed) {
      setRenamingHousehold(false);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/household", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Non è stato possibile rinominare il profilo.");
      return;
    }
    setRenamingHousehold(false);
    load();
  }

  async function handleRename(id: string, name: string) {
    if (renameSubmittedRef.current) return;
    renameSubmittedRef.current = true;

    const trimmed = name.trim();
    if (!trimmed) {
      setRenaming(null);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/freezers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Non è stato possibile rinominare il congelatore.");
      return;
    }
    setRenaming(null);
    load();
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/freezers/${id}`, { method: "DELETE" });
    setBusy(false);
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Non è stato possibile eliminare il congelatore.");
      return;
    }
    load();
  }

  async function handleCreate() {
    // Stessa ragione del ref per handleRename qui sopra: l'Invio da tastiera
    // e il click sul pulsante "Crea" possono arrivare entrambi prima che
    // "busy" si aggiorni, creando due congelatori con lo stesso nome.
    if (createSubmittedRef.current) return;
    createSubmittedRef.current = true;

    const trimmed = newName.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/freezers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Non è stato possibile creare il congelatore.");
      return;
    }
    setNewName("");
    setCreating(false);
    load();
  }

  if (!owned || !household) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      {renamingHousehold ? (
        <input
          autoFocus
          defaultValue={household.name}
          disabled={busy}
          onBlur={(e) => handleRenameHousehold(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameHousehold(e.currentTarget.value);
            if (e.key === "Escape") setRenamingHousehold(false);
          }}
          className="tap-target w-full rounded-full border border-border bg-background px-4 py-2 text-lg font-extrabold text-foreground"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            renameHouseholdSubmittedRef.current = false;
            setRenamingHousehold(true);
          }}
          className="flex items-center gap-2 self-start text-lg font-extrabold text-foreground hover:underline"
        >
          🧊 {household.name} ✏️
        </button>
      )}
      <p className="text-sm text-muted">
        Se hai più congelatori in casa (es. cucina e cantina), tienili separati qui sotto: ognuno
        con i suoi prodotti. Condividendo il profilo, chi entra vede tutti i tuoi congelatori
        insieme.
      </p>

      <ul className="flex flex-col gap-2">
        {owned.map((f) => (
          <li key={f.id}>
            {renaming === f.id ? (
              <input
                autoFocus
                defaultValue={f.name}
                disabled={busy}
                onBlur={(e) => handleRename(f.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(f.id, e.currentTarget.value);
                  if (e.key === "Escape") setRenaming(null);
                }}
                className="tap-target w-full rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground"
              />
            ) : deletingId === f.id ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-rose-50 px-4 py-2.5">
                <span className="text-sm font-semibold text-rose-700">
                  Eliminare &quot;{f.name}&quot;?
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(f.id)}
                  className="tap-target rounded-full bg-rose-600 px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  Sì, elimina
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeletingId(null)}
                  className="tap-target rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    renameSubmittedRef.current = false;
                    setRenaming(f.id);
                  }}
                  className="tap-target flex-1 rounded-full border border-border bg-background px-4 py-2 text-left text-sm font-bold text-foreground hover:bg-surface"
                >
                  {f.name}
                </button>
                {owned.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDeletingId(f.id)}
                    aria-label={`Elimina ${f.name}`}
                    className="tap-target shrink-0 rounded-full border border-border bg-background px-3 py-2 text-sm text-muted hover:bg-surface hover:text-rose-600"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {creating ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Es. Cantina, Garage..."
            disabled={busy}
            className="tap-target flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !newName.trim()}
            className="tap-target rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Crea
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            createSubmittedRef.current = false;
            setCreating(true);
          }}
          className="tap-target self-start rounded-full border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-surface"
        >
          + Aggiungi congelatore
        </button>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setSharing((s) => !s)}
        className="tap-target self-start rounded-full border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-surface"
      >
        🤝 Condividi questo profilo
      </button>
      {sharing && <ShareHousehold householdId={household.id} />}
    </section>
  );
}
