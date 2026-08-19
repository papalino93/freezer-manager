// Discreto e in fondo alla pagina: chi usa l'app (anche Carla) non deve
// vederlo come prima cosa, ma chi vuole offrire un caffè trova il link.
export function SupportLink() {
  return (
    <p className="flex justify-center pb-2">
      <a
        href="https://buymeacoffee.com/papalino"
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-bold text-foreground shadow-sm hover:bg-background"
      >
        ☕ Offrimi un caffè
      </a>
    </p>
  );
}
