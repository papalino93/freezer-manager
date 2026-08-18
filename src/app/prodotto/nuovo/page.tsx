import Link from "next/link";

export const metadata = { title: "Aggiungi prodotto" };

export default function NuovoProdottoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">+ Aggiungi</h1>
        <p className="mt-1 text-muted">Come vuoi aggiungere il prodotto?</p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/prodotto/nuovo/foto"
          className="tap-target flex flex-col gap-1 rounded-3xl border border-border bg-surface px-5 py-5 shadow-sm hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            📷 Fotografa confezione
          </span>
          <span className="text-muted">Riconosco automaticamente il prodotto dalla foto.</span>
        </Link>

        <Link
          href="/prodotto/nuovo/manuale"
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
