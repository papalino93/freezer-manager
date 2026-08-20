/**
 * Logo originale: nonna stilizzata + fiocco di ghiaccio, il concept
 * richiesto per l'identità del progetto (punto 3-4-68). Un solo file SVG
 * riusato ovunque (navbar, favicon, icone PWA) per restare coerente.
 *
 * I capelli "a permanente" (i cerchietti in alto) e gli occhiali sono
 * separati dalla spalla/cardigan sottostante, con un collo visibile in
 * mezzo: senza questa separazione il cofano bianco continuo leggeva come
 * un velo invece che come capelli bianchi da nonnina.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Il Mio Congelatore"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="#3f6b4f" />
      {/* cardigan / spalle */}
      <path d="M32 92C32 68 38 58 50 58C62 58 68 68 68 92Z" fill="#c9776a" />
      {/* capelli bianchi a permanente */}
      <path d="M33 40C33 26 40 16 50 16C60 16 67 26 67 40Z" fill="#fdfaf5" />
      <circle cx="32" cy="41" r="7" fill="#fdfaf5" />
      <circle cx="68" cy="41" r="7" fill="#fdfaf5" />
      <circle cx="38" cy="22" r="7" fill="#fdfaf5" />
      <circle cx="46" cy="14" r="7.5" fill="#fdfaf5" />
      <circle cx="54" cy="14" r="7.5" fill="#fdfaf5" />
      <circle cx="62" cy="22" r="7" fill="#fdfaf5" />
      {/* viso */}
      <circle cx="50" cy="47" r="14" fill="#f0c39a" />
      {/* occhiali */}
      <circle cx="43" cy="46" r="5.5" fill="none" stroke="#5b4636" strokeWidth="1.8" />
      <circle cx="57" cy="46" r="5.5" fill="none" stroke="#5b4636" strokeWidth="1.8" />
      <path d="M48.5 46h3" stroke="#5b4636" strokeWidth="1.5" strokeLinecap="round" />
      {/* occhi */}
      <circle cx="43" cy="46" r="1.6" fill="#2c2620" />
      <circle cx="57" cy="46" r="1.6" fill="#2c2620" />
      {/* sorriso */}
      <path
        d="M44 52c2 2.5 10 2.5 12 0"
        stroke="#a85c3f"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* guance */}
      <circle cx="40" cy="50" r="2.2" fill="#e79b7a" opacity="0.6" />
      <circle cx="60" cy="50" r="2.2" fill="#e79b7a" opacity="0.6" />
      {/* fiocco di ghiaccio */}
      <g stroke="#bfe9ff" strokeWidth="3" strokeLinecap="round">
        <path d="M78 22v14M71 29h14M73 24l10 10M83 24 73 34" />
      </g>
      <circle cx="78" cy="29" r="10.5" fill="none" stroke="#e6f9ff" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
