"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Se la registrazione fallisce l'app funziona lo stesso, solo
        // senza installazione: non è un errore da mostrare all'utente.
      });
    }
  }, []);

  return null;
}
