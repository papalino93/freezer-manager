"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export default function NuovoProdottoPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Caricamento…</p>}>
      <NuovoProdottoContent />
    </Suspense>
  );
}

function NuovoProdottoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (ignore || !data) return;
        setFreezers(data.freezers);
        // Con un solo congelatore non c'è scelta da fare: saltiamo dritti
        // alla domanda successiva ("come vuoi aggiungerlo?").
        if (data.freezers.length === 1 && !searchParams.get("freezerId")) {
          const params = new URLSearchParams(searchParams);
          params.set("freezerId", data.freezers[0].id);
          router.replace(`/prodotto/nuovo?${params.toString()}`);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const freezerId = searchParams.get("freezerId");

  if (!freezers) {
    return <p className="py-16 text-center text-muted">Caricamento…</p>;
  }

  // Più di un congelatore e nessuno ancora scelto: la domanda è
  // obbligatoria, niente tendina, bottoni grandi (punto richiesto).
  if (freezers.length > 1 && !freezerId) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">+ Aggiungi</h1>
          <p className="mt-1 text-muted">Dove lo stai mettendo?</p>
        </div>
        <div className="flex flex-col gap-4">
          {freezers.map((f) => (
            <Link
              key={f.id}
              href={`/prodotto/nuovo?freezerId=${f.id}`}
              className="tap-target flex items-center gap-3 rounded-3xl border border-border bg-surface px-5 py-6 text-xl font-extrabold text-foreground shadow-sm hover:shadow-md"
            >
              {f.role === "OWNER" ? "🧊" : "👥"} {f.name}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const query = freezerId ? `?freezerId=${freezerId}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">+ Aggiungi</h1>
        <p className="mt-1 text-muted">Come vuoi aggiungere il prodotto?</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href={`/prodotto/nuovo/foto${query}`}
          className="tap-target flex flex-col gap-1 rounded-3xl border border-border bg-surface px-5 py-5 shadow-sm hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            📷 Fotografa confezione
          </span>
          <span className="text-muted">Riconosco automaticamente il prodotto dalla foto.</span>
        </Link>

        <Link
          href={`/prodotto/nuovo/manuale${query}`}
          className="tap-target flex flex-col gap-1 rounded-3xl border border-border bg-surface px-5 py-5 shadow-sm hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            ✍️ Inserisci manualmente
          </span>
          <span className="text-muted">Compila tu i dati del prodotto.</span>
        </Link>
      </div>
    </div>
  );
}
