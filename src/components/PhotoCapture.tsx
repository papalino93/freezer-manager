"use client";

import { useRef, useState } from "react";
import { readImageAsDataUrl } from "@/lib/read-image-file";

export function PhotoCapture({
  label,
  onPhoto,
  disabled,
}: {
  label: string;
  onPhoto: (dataUrl: string) => void;
  /** Mentre l'AI sta ancora leggendo la foto precedente, non se ne può
   * scattare/scegliere un'altra: altrimenti partono due riconoscimenti in
   * parallelo e vince quello che risponde per ultimo, con risultati che non
   * corrispondono più alla foto mostrata in anteprima. */
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file || disabled) return;
    const dataUrl = await readImageAsDataUrl(file);
    setPreview(dataUrl);
    onPhoto(dataUrl);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL locale, non un'immagine remota ottimizzabile
        <img
          src={preview}
          alt="Anteprima della foto"
          className="max-h-72 w-full rounded-2xl border border-border object-contain"
        />
      ) : (
        <div className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface text-muted">
          <span className="text-4xl" aria-hidden>
            📷
          </span>
          <span className="text-sm font-semibold">Nessuna foto ancora</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="tap-target w-full rounded-full bg-brand px-5 py-4 text-lg font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {preview ? "📷 Rifai la foto" : label}
      </button>
    </div>
  );
}
