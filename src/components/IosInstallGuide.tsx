"use client";

import { useState } from "react";

export function IosInstallGuide({
  onClose,
  isSafari,
}: {
  onClose: () => void;
  isSafari: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Come installare l'app su iPhone"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-t-3xl bg-background p-6 sm:rounded-3xl"
      >
        {isSafari ? (
          <>
            <h2 className="text-lg font-extrabold text-foreground">
              Aggiungi l&apos;app alla schermata Home
            </h2>
            <ol className="flex flex-col gap-4">
              <Step
                emoji="📤"
                text={<>Premi l&apos;icona di condivisione in basso nel browser.</>}
              />
              <Step
                emoji="➕"
                text={
                  <>
                    Scorri in giù e tocca{" "}
                    <strong>&quot;Aggiungi alla schermata Home&quot;</strong>.
                  </>
                }
              />
              <Step emoji="✓" text={<>Tocca <strong>&quot;Aggiungi&quot;</strong> in alto a destra.</>} />
            </ol>
          </>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-foreground">Serve Safari</h2>
            <p className="text-sm text-foreground">
              Su iPhone, solo <strong>Safari</strong> (il browser di Apple, icona 🧭) può
              installare l&apos;app sulla schermata Home. È una limitazione del telefono, non di
              questo sito: con altri browser quell&apos;opzione non c&apos;è.
            </p>
            <ol className="flex flex-col gap-4">
              <Step emoji="🧭" text={<>Apri l&apos;app <strong>Safari</strong> su questo iPhone.</>} />
              <Step
                emoji="🔗"
                text={
                  <>
                    Copia il link qui sotto e incollalo nella barra degli indirizzi di Safari.
                  </>
                }
              />
              <Step
                emoji="📤"
                text={
                  <>
                    Poi premi l&apos;icona di condivisione e tocca{" "}
                    <strong>&quot;Aggiungi alla schermata Home&quot;</strong>.
                  </>
                }
              />
            </ol>
            <button
              type="button"
              onClick={copyLink}
              className="tap-target rounded-full border border-border bg-surface px-5 py-3 text-base font-bold text-foreground hover:bg-background"
            >
              {copied ? "✓ Copiato" : "📋 Copia il link"}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="tap-target rounded-full bg-brand px-5 py-3 text-base font-bold text-white hover:bg-brand-dark"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}

function Step({ emoji, text }: { emoji: string; text: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-xl"
        aria-hidden
      >
        {emoji}
      </span>
      <span className="text-sm text-foreground">{text}</span>
    </li>
  );
}
