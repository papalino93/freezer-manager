"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { emptyFormValues, formValuesToPayload, type ProductFormValues } from "@/lib/form-values";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NuovoManualePage() {
  const router = useRouter();

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Nuovo prodotto</h1>
        <p className="mt-1 text-muted">Solo il nome è obbligatorio: il resto puoi lasciarlo vuoto.</p>
      </div>
      <ProductForm
        initialValues={emptyFormValues({ frozenDate: todayInputValue() })}
        submitLabel="Salva"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
