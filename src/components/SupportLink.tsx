// Discreto e in fondo alla pagina: chi usa l'app (anche Carla) non deve
// vederlo come prima cosa, ma chi vuole offrire un caffè trova il link.
export function SupportLink() {
  return (
    <p className="pb-2 text-center text-sm text-muted">
      <a
        href="https://buymeacoffee.com/papalino"
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target inline-flex items-center gap-1 hover:text-foreground hover:underline"
      >
        ☕ Offrimi un caffè
      </a>
    </p>
  );
}
