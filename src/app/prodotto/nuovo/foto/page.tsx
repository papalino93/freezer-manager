"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhotoCapture } from "@/components/PhotoCapture";
import { ProductForm } from "@/components/ProductForm";
import { emptyFormValues, formValuesToPayload, type ProductFormValues } from "@/lib/form-values";
import type { CategoryValue } from "@/lib/types";

type Status = "idle" | "loading" | "error" | "ready";

interface RecognizedResult {
  name: string | null;
  brand: string | null;
  category: CategoryValue;
  quantity: string | null;
  expiryDate: string | null;
  expiryDateLegible: boolean;
  warnings: string[];
}

export default function FotoConfezionePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<RecognizedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePhoto(dataUrl: string) {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/ai/recognize-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Non riesco a leggere bene la foto.");
        setStatus("error");
        return;
      }
      setResult(data.result);
      setStatus("ready");
    } catch {
      setErrorMessage("Non riesco a leggere bene la foto. Riprova.");
      setStatus("error");
    }
  }

  async function handleSubmit(values: ProductFormValues): Promise<string | void> {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValuesToPayload(values)),
    });
    if (!res.ok) {
      return "Qualcosa è andato storto. Controlla i dati e riprova.";
    }
    router.push("/");
    router.refresh();
  }

  if (status === "ready" && result) {
    const warnings = [...result.warnings];
    if (!result.name) warnings.unshift("Nome non riconosciuto: controllalo tu.");
    if (result.expiryDate === null && !result.expiryDateLegible) {
      warnings.push("⚠️ Data di scadenza non riconosciuta.");
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Controlla i dati</h1>
          <p className="mt-1 text-muted">
            Ho letto questi dati dalla foto. Correggi quello che serve, poi conferma.
          </p>
        </div>
        <ProductForm
          initialValues={emptyFormValues({
            name: result.name ?? "",
            brand: result.brand ?? "",
            category: result.category,
            quantity: result.quantity ?? "",
            expiryDate: result.expiryDate ?? "",
            frozenDate: new Date().toISOString().slice(0, 10),
          })}
          submitLabel="✓ Aggiungi al congelatore"
          onSubmit={handleSubmit}
          aiNotice={
            warnings.length > 0
              ? warnings.join(" ")
              : "Ho riconosciuto questi dati dalla foto: controllali prima di salvare."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">📷 Fotografa confezione</h1>
        <p className="mt-1 text-muted">
          Inquadra bene il nome del prodotto e, se c&apos;è, la data di scadenza.
        </p>
      </div>

      <PhotoCapture label="Scatta o scegli una foto" onPhoto={handlePhoto} />

      {status === "loading" && (
        <p className="text-center font-semibold text-muted">Sto leggendo la foto…</p>
      )}

      {status === "error" && errorMessage && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-rose-50 px-4 py-4 text-center">
          <p className="font-semibold text-rose-700">{errorMessage}</p>
          <Link
            href="/prodotto/nuovo/manuale"
            className="tap-target rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-surface"
          >
            ✍️ Inserisci manualmente
          </Link>
        </div>
      )}
    </div>
  );
}
