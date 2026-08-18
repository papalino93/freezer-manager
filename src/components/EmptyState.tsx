import Link from "next/link";

export function EmptyState({
  title,
  description,
  showOnboardingActions = false,
}: {
  title: string;
  description: string;
  showOnboardingActions?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span className="text-5xl" aria-hidden>
        🧊
      </span>
      <div>
        <h2 className="text-xl font-extrabold text-foreground">{title}</h2>
        <p className="mt-1 text-muted">{description}</p>
      </div>
      {showOnboardingActions && (
        <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/importa"
            className="tap-target rounded-full bg-brand px-5 py-3 text-center font-bold text-white hover:bg-brand-dark"
          >
            📷 Importa la lista da una foto
          </Link>
          <Link
            href="/prodotto/nuovo"
            className="tap-target rounded-full border border-border bg-background px-5 py-3 text-center font-bold text-foreground hover:bg-surface"
          >
            + Inserisci il primo prodotto
          </Link>
        </div>
      )}
    </div>
  );
}
