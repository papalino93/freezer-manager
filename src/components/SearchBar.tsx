"use client";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg"
      >
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cerca nel congelatore..."
        aria-label="Cerca nel congelatore"
        className="tap-target w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-base text-foreground placeholder:text-muted focus:border-brand"
      />
    </div>
  );
}
