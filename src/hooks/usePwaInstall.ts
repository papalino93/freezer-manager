"use client";

import { useEffect, useState } from "react";

// L'evento che Chrome/Edge su Android emettono quando la pagina è
// installabile. Non è (ancora) nei tipi standard del DOM.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallState {
  /** L'app gira già come app installata (standalone). */
  isStandalone: boolean;
  /** Safari su iPhone/iPad: niente prompt automatico, serve la guida illustrata. */
  isIOS: boolean;
  /** Il browser ha offerto il prompt nativo di installazione (Android/desktop). */
  canPromptInstall: boolean;
  /** Avvia il prompt nativo (solo se canPromptInstall). */
  promptInstall: () => Promise<void>;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // matchMedia/userAgent esistono solo lato client: lette qui per
    // evitare un mismatch di idratazione tra server e browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(detectStandalone());
    setIsIOS(detectIOS());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return {
    isStandalone,
    isIOS,
    canPromptInstall: deferredPrompt !== null,
    promptInstall,
  };
}
