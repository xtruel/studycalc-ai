/**
 * Logo StudyCalc AI — calcolatrice old-school con la "S" sul display, sfondo blu-viola.
 * Versione vettoriale semplificata, leggibile anche a dimensioni piccole (28–40px).
 * Usalo dentro un contenitore quadrato con `overflow-hidden rounded-*`.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="StudyCalc AI">
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="0.55" stopColor="#6d28d9" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="lg-s" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* sfondo blu-viola */}
      <rect width="100" height="100" rx="22" fill="url(#lg-bg)" />

      {/* corpo calcolatrice */}
      <rect x="26" y="16" width="48" height="68" rx="9" fill="#f4f6fb" stroke="#c3c9d6" strokeWidth="1.2" />

      {/* display con la S */}
      <rect x="32" y="23" width="36" height="22" rx="3.5" fill="#0b1220" />
      <text x="50" y="41" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif"
            fontSize="20" fontWeight="800" fill="url(#lg-s)">S</text>

      {/* tasti semplificati (3 colonne chiare + 1 accent) */}
      <g fill="#e2e6ee">
        <rect x="32" y="52" width="8" height="7" rx="2" />
        <rect x="43" y="52" width="8" height="7" rx="2" />
        <rect x="54" y="52" width="8" height="7" rx="2" />
        <rect x="32" y="62" width="8" height="7" rx="2" />
        <rect x="43" y="62" width="8" height="7" rx="2" />
        <rect x="54" y="62" width="8" height="7" rx="2" />
        <rect x="32" y="72" width="19" height="7" rx="2" />
      </g>
      <rect x="62" y="52" width="6" height="17" rx="2" fill="url(#lg-s)" />
      <rect x="54" y="72" width="14" height="7" rx="2" fill="#f59e0b" />
    </svg>
  );
}
