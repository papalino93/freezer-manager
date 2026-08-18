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
  /** iPhone/iPad, un browser qualsiasi. */
  isIOS: boolean;
  /**
   * Su iOS solo Safari può installare l'app sulla schermata Home: è un
   * limite del sistema operativo (Apple), non un problema di questa app.
   * Chrome, Firefox ecc. su iPhone non hanno quell'opzione.
   */
  isIOSSafari: boolean;
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

/**
 * Su iOS tutti i browser usano il motore di Safari, ma solo Safari stesso
 * espone "Aggiungi alla schermata Home" come vera app installabile: gli
 * altri hanno il proprio identificativo nello user agent (CriOS = Chrome,
 * FxiOS = Firefox, EdgiOS = Edge, OPiOS/OPT = Opera, ...).
 */
function detectIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|DuckDuckGo|Brave/i.test(navigator.userAgent);
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(true);

  useEffect(() => {
    // matchMedia/userAgent esistono solo lato client: lette qui per
    // evitare un mismatch di idratazione tra server e browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(detectStandalone());
    setIsIOS(detectIOS());
    setIsIOSSafari(detectIOSSafari());

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
    isIOSSafari,
    canPromptInstall: deferredPrompt !== null,
    promptInstall,
  };
}
