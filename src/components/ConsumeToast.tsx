"use client";

// Fisso in basso ma sopra lo spazio riservato al pulsante "Aggiungi", e
// sparisce da solo: un ripensamento su un consumo appena segnato non deve
// costringere ad aprire lo Storico (punto emerso da una domanda dell'utente).
export function ConsumeToast({ name, onUndo }: { name: string; onUndo: () => void }) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-foreground px-4 py-3 shadow-lg"
    >
      <span className="text-sm font-semibold text-white">✓ {name} consumato</span>
      <button
        type="button"
        onClick={onUndo}
        className="tap-target shrink-0 rounded-full px-3 py-1.5 text-sm font-extrabold text-white underline hover:no-underline"
      >
        Annulla
      </button>
    </div>
  );
}

// Un annullamento fallito non deve sembrare riuscito: senza questo, l'unico
// segnale prima era il prodotto che restava (in silenzio) tra i consumati.
export function ConsumeToastError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-center shadow-lg"
    >
      <span className="text-sm font-semibold text-white">{message}</span>
    </div>
  );
}
