"use client";

interface FreezerOption {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

// Mostrato solo dentro una categoria aperta, e solo se ci sono più
// congelatori: filtra ulteriormente per dove si trova il prodotto.
export function LocationFilterPills({
  freezers,
  value,
  onChange,
}: {
  freezers: FreezerOption[];
  value: string | null;
  onChange: (freezerId: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Pill label="Tutti" active={value === null} onClick={() => onChange(null)} />
      {freezers.map((f) => (
        <Pill
          key={f.id}
          label={`${f.role === "OWNER" ? "🧊" : "👥"} ${f.name}`}
          active={value === f.id}
          onClick={() => onChange(f.id)}
        />
      ))}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tap-target rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
        active
          ? "border-brand bg-brand text-white"
          : "border-border bg-surface text-foreground hover:bg-background"
      }`}
    >
      {label}
    </button>
  );
}
