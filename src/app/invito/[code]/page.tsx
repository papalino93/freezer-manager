"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Status = "loading" | "error";

export default function InvitoPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function join() {
      try {
        const res = await fetch("/api/household/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: params.code }),
        });
        const data = await res.json().catch(() => ({}));
        if (ignore) return;
        if (!res.ok) {
          setErrorMessage(data.error ?? "Qualcosa è andato storto. Riprova.");
          setStatus("error");
          return;
        }
        router.push("/");
        router.refresh();
      } catch {
        if (!ignore) {
          setErrorMessage("Qualcosa è andato storto. Riprova.");
          setStatus("error");
        }
      }
    }

    join();
    return () => {
      ignore = true;
    };
  }, [params.code, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      {status === "loading" ? (
        <>
          <span className="text-4xl" aria-hidden>
            🤝
          </span>
          <p className="text-lg font-semibold text-foreground">Ti sto aggiungendo al congelatore…</p>
        </>
      ) : (
        <>
          <span className="text-4xl" aria-hidden>
            🧊
          </span>
          <p className="text-lg font-semibold text-foreground">{errorMessage}</p>
        </>
      )}
    </div>
  );
}
