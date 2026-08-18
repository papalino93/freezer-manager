"use client";

import { useEffect, useState } from "react";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

// Gestione dei congelatori di proprietà: chi ne ha più d'uno in casa (es.
// uno in cucina e uno in cantina) può crearli qui e dargli un nome, invece
// di ritrovarsi solo con l'unico congelatore personale automatico.
export function ManageFreezers() {
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFreezers(data.freezers);
      })
      .catch(() => {});
  }

  useEffect(load, []);

  const owned = freezers?.filter((f) => f.role === "OWNER") ?? null;

  async function handleRename(id: string, name: string) {
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

  async function handleCreate() {
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

  if (!owned) return null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-lg font-extrabold text-foreground">🧊 I miei congelatori</h2>
      <p className="text-sm text-muted">
        Se ne hai più di uno in casa (es. cucina e cantina), tienili separati: ognuno con i suoi
        prodotti.
      </p>

      <ul className="flex flex-col gap-2">
        {owned.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
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
                className="tap-target flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground"
              />
            ) : (
              <button
                type="button"
                onClick={() => setRenaming(f.id)}
                className="tap-target flex-1 rounded-full border border-border bg-background px-4 py-2 text-left text-sm font-bold text-foreground hover:bg-surface"
              >
                {f.name}
              </button>
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
          onClick={() => setCreating(true)}
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
    </section>
  );
}
