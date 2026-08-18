"use client";

import { useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { IosInstallGuide } from "@/components/IosInstallGuide";

// Voce sempre disponibile, anche se la card sulla home è stata chiusa
// (punto 83).
export function InstallSection() {
  const { isStandalone, isIOS, canPromptInstall, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      {isStandalone ? (
        <p className="font-bold text-brand-dark">✓ App installata</p>
      ) : (
        <>
          <p className="font-bold text-foreground">📱 Installa l&apos;app sul telefono</p>
          <p className="mt-1 text-sm text-muted">
            La trovi sulla schermata Home come una normale app, senza aprire il browser.
          </p>
          {(canPromptInstall || isIOS) && (
            <button
              type="button"
              onClick={() => (isIOS ? setShowIosGuide(true) : promptInstall())}
              className="tap-target mt-3 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
            >
              Installa
            </button>
          )}
        </>
      )}
      {showIosGuide && <IosInstallGuide onClose={() => setShowIosGuide(false)} />}
    </section>
  );
}
