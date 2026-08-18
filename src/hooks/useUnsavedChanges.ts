"use client";

import { useEffect } from "react";

/**
 * Registro globale di "cose che si perderebbero" attualmente visibili: più
 * pagine/componenti possono essere montati insieme (es. il form dentro la
 * pagina), quindi non basta un solo flag — ogni "guardia" attiva tiene il
 * proprio messaggio finché il suo componente resta montato con active=true.
 */
const activeGuards = new Map<symbol, string>();

const DEFAULT_MESSAGE = "Hai delle modifiche non salvate. Vuoi comunque uscire?";

/**
 * Da chiamare in una pagina/form con qualcosa di importante non ancora
 * salvato (foto appena riconosciuta, riga di importazione corretta a mano,
 * modifica in corso): il pulsante "Indietro" dell'header chiede conferma
 * solo mentre almeno una guardia è attiva (punto audit #3). Copre anche la
 * chiusura/reload della scheda tramite beforeunload.
 */
export function useUnsavedChangesGuard(active: boolean, message: string = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!active) return;

    const key = Symbol();
    activeGuards.set(key, message);

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      activeGuards.delete(key);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [active, message]);
}

/** true = si può procedere con la navigazione, false = l'utente ha annullato. */
export function confirmDiscardUnsavedChanges(): boolean {
  if (activeGuards.size === 0) return true;
  const [message] = activeGuards.values();
  return window.confirm(message);
}
