/**
 * Logo originale: nonna stilizzata + fiocco di ghiaccio, il concept
 * richiesto per l'identità del progetto (punto 3-4-68). Un solo file SVG
 * riusato ovunque (navbar, favicon, icone PWA) per restare coerente.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Il Mio Congelatore"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="#0f7a72" />
      {/* capelli bianchi / scialle */}
      <path
        d="M50 20c-13 0-22 9-22 21v9c0 4 2 7 5 9l3 12c1 3 3 4 6 4h16c3 0 5-1 6-4l3-12c3-2 5-5 5-9v-9c0-12-9-21-22-21Z"
        fill="#fdfaf5"
      />
      {/* viso */}
      <circle cx="50" cy="45" r="15" fill="#f0c39a" />
      {/* occhi */}
      <circle cx="45" cy="44" r="1.8" fill="#2c2620" />
      <circle cx="55" cy="44" r="1.8" fill="#2c2620" />
      {/* sorriso */}
      <path
        d="M44 50c2 2.5 10 2.5 12 0"
        stroke="#a85c3f"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* guance */}
      <circle cx="41" cy="48" r="2.2" fill="#e79b7a" opacity="0.6" />
      <circle cx="59" cy="48" r="2.2" fill="#e79b7a" opacity="0.6" />
      {/* fiocco di ghiaccio */}
      <g stroke="#bfe9ff" strokeWidth="3" strokeLinecap="round">
        <path d="M78 22v14M71 29h14M73 24l10 10M83 24 73 34" />
      </g>
      <circle cx="78" cy="29" r="10.5" fill="none" stroke="#e6f9ff" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
