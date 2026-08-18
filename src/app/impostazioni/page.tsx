"use client";

import { signOut, useSession } from "next-auth/react";
import { ShareFreezer } from "@/components/ShareFreezer";
import { ManageFreezers } from "@/components/ManageFreezers";
import { InstallSection } from "@/components/InstallSection";

export default function ImpostazioniPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">⚙️ Impostazioni</h1>
        {session?.user?.email && (
          <p className="mt-1 text-muted">Accesso con {session.user.email}</p>
        )}
      </div>

      <ManageFreezers />

      <ShareFreezer />

      <InstallSection />

      <section className="rounded-2xl border border-border bg-surface p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/accedi" })}
          className="tap-target rounded-full border border-border bg-background px-4 py-3 text-sm font-bold text-foreground hover:bg-surface"
        >
          Esci
        </button>
      </section>
    </div>
  );
}
