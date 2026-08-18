"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { productToFormValues, formValuesToPayload, type ProductFormValues } from "@/lib/form-values";
import type { ProductDTO } from "@/lib/types";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export default function ModificaProdottoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [freezers, setFreezers] = useState<FreezerOption[] | null>(null);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setProduct(data.product))
      .catch(() => setNotFound(true));
  }, [params.id]);

  useEffect(() => {
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setFreezers(data.freezers);
      })
      .catch(() => {});
  }, []);

  async function handleMove(freezerId: string) {
    if (!product) return;
    setMoving(true);
    setMoveError(null);
    const res = await fetch(`/api/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formValuesToPayload(productToFormValues(product)), freezerId }),
    });
    setMoving(false);
    if (!res.ok) {
      setMoveError("Non è stato possibile spostare il prodotto.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleSubmit(values: ProductFormValues): Promise<string | void> {
    const res = await fetch(`/api/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValuesToPayload(values)),
    });
    if (!res.ok) {
      return "Qualcosa è andato storto. Controlla i dati e riprova.";
    }
    router.push("/");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/products/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  if (notFound) {
    return <p className="py-16 text-center text-muted">Prodotto non trovato.</p>;
  }

  if (!product) {
    return <p className="py-16 text-center text-muted">Caricamento…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Modifica prodotto</h1>
      </div>

      <ProductForm
        initialValues={productToFormValues(product)}
        submitLabel="Salva modifiche"
        onSubmit={handleSubmit}
      />

      {freezers && freezers.length > 1 && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <h2 className="text-sm font-bold text-foreground">📦 Sposta in un altro congelatore</h2>
          <p className="text-sm text-muted">
            Ora è in <strong>{freezers.find((f) => f.id === product.freezerId)?.name}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            {freezers
              .filter((f) => f.id !== product.freezerId)
              .map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={moving}
                  onClick={() => handleMove(f.id)}
                  className="tap-target rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-surface disabled:opacity-60"
                >
                  {f.role === "OWNER" ? "🧊" : "👥"} Sposta in {f.name}
                </button>
              ))}
          </div>
          {moveError && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {moveError}
            </p>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4">
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="tap-target text-sm font-semibold text-rose-600 hover:underline"
          >
            🗑️ Elimina prodotto
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3">
            <span className="text-sm font-semibold text-rose-700">
              Eliminare definitivamente questo prodotto?
            </span>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="tap-target rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Sì, elimina
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
              className="tap-target rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted"
            >
              Annulla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
