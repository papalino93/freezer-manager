"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { IosInstallGuide } from "@/components/IosInstallGuide";

const DISMISSED_KEY = "installCardDismissed";

// Card non invasiva mostrata in fondo alla lista dei prodotti, non al
// primo login (punto 81). Chi la chiude non la rivede più qui, ma trova
// sempre la stessa opzione in Impostazioni.
export function InstallCard() {
  const { isStandalone, isIOS, canPromptInstall, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Lettura di localStorage: disponibile solo lato client, va fatta qui
    // e non durante il render (altrimenti mismatch di idratazione).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
  }, []);

  if (isStandalone || dismissed) return null;
  if (!canPromptInstall && !isIOS) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  function handleInstall() {
    if (isIOS) {
      setShowIosGuide(true);
    } else {
      promptInstall();
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <div>
          <p className="font-bold text-foreground">📱 Vuoi averlo sempre a portata di mano?</p>
          <p className="mt-1 text-sm text-muted">
            Aggiungi l&apos;app alla schermata Home per aprirla come una normale applicazione,
            senza usare il browser.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="tap-target rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            + Aggiungi alla Home
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="tap-target rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-surface"
          >
            Non ora
          </button>
        </div>
      </div>

      {showIosGuide && <IosInstallGuide onClose={() => setShowIosGuide(false)} />}
    </>
  );
}
