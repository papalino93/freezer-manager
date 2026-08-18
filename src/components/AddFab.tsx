import Link from "next/link";

export function AddFab() {
  return (
    <Link
      href="/prodotto/nuovo"
      className="tap-target fixed bottom-5 right-4 z-30 flex items-center gap-2 rounded-full bg-brand px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-brand/30 hover:bg-brand-dark sm:right-6"
      aria-label="Aggiungi prodotto"
    >
      <span className="text-xl leading-none" aria-hidden>
        +
      </span>
      Aggiungi
    </Link>
  );
}
