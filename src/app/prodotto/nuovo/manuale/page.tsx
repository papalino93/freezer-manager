"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ManualAddWizard } from "@/components/ManualAddWizard";
import { emptyFormValues, formValuesToPayload, type ProductFormValues } from "@/lib/form-values";
import { useDestinationFreezer } from "@/hooks/useDestinationFreezer";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NuovoManualePage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">Caricamento…</p>}>
      <NuovoManualeContent />
    </Suspense>
  );
}

function NuovoManualeContent() {
  const router = useRouter();
  const freezerId = useDestinationFreezer();

  async function handleSubmit(values: ProductFormValues): Promise<string | void> {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formValuesToPayload(values), freezerId }),
    });
    if (!res.ok) {
      return "Qualcosa è andato storto. Controlla i dati e riprova.";
    }
    router.push("/");
    router.refresh();
  }

  return (
    <ManualAddWizard
      initialValues={emptyFormValues({ frozenDate: todayInputValue() })}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
