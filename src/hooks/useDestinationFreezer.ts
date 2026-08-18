"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Il congelatore di destinazione scelto in /prodotto/nuovo, passato via
 * query string. Se manca (es. link diretto) e l'utente ne ha più di uno,
 * lo rimandiamo lì a scegliere invece di indovinare; con uno solo lo
 * usiamo direttamente.
 */
export function useDestinationFreezer(): string | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("freezerId");
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    if (fromQuery) return;
    fetch("/api/freezers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.freezers.length === 1) {
          setFallback(data.freezers[0].id);
        } else {
          router.replace("/prodotto/nuovo");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromQuery]);

  return fromQuery ?? fallback;
}
