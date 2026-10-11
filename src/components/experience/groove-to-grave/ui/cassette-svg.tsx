import { couleurs as tokens } from '../tokens'

interface CassetteSvgProps {
  coque: string
  etiquette: string
  bande: string
  /** Référence ou date dans la bande. */
  reference: string
  face?: string
  ligne1: string
  ligne2: string
  texteBande: string
}

/**
 * La cassette, SVG en ligne aux proportions de la maquette (200 × 128), décorative : le nom
 * accessible vient du lien ou du texte voisin. Coque et bande colorées depuis la pochette ;
 * l'étiquette reste poster. Bobines fixes en Phase 2.
 */
export function CassetteSvg({ coque, etiquette, bande, reference, face = 'A', ligne1, ligne2, texteBande }: CassetteSvgProps) {
  return (
    <svg viewBox="0 0 200 128" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="196" height="124" rx="8" fill={coque} stroke={tokens.ink} strokeWidth="2.5" />
      {[11, 189].flatMap((cx) => [11, 117].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" fill={tokens.ink} />))}
      <rect x="16" y="10" width="168" height="68" rx="3" fill={etiquette} stroke={tokens.ink} strokeWidth="1.2" />
      <rect x="16" y="10" width="168" height="13" fill={bande} />
      <text x="22" y="20.5" fontSize="10" fontWeight="800" fill={texteBande} style={{ fontFamily: 'var(--g2g-font-archivo), Archivo, sans-serif', fontStretch: '80%', letterSpacing: 0.3 }}>
        {reference}
      </text>
      <text x="178" y="20.5" textAnchor="end" fontSize="10" fontWeight="800" fill={texteBande} style={{ fontFamily: 'var(--g2g-font-archivo), Archivo, sans-serif' }}>
        {face}
      </text>
      <text x="22" y="38" fontSize="13" fill={tokens.ink} style={{ fontFamily: 'var(--g2g-font-marker), Permanent Marker, cursive' }}>
        {ligne1}
      </text>
      <text x="22" y="51" fontSize="10" fill={tokens.ink} style={{ fontFamily: 'var(--g2g-font-marker), Permanent Marker, cursive' }}>
        {ligne2}
      </text>
      <rect x="52" y="56" width="96" height="18" rx="9" fill={tokens.ink} />
      {[72, 128].map((cx) => (
        <g key={cx} className="g2g-bobine">
          <circle cx={cx} cy="65" r="7" fill={tokens.poster} />
          <path d={`M${cx} 58.5v13M${cx - 5.6} 61.8l11.2 6.4M${cx - 5.6} 68.2l11.2-6.4`} stroke={tokens.ink} strokeWidth="1.6" />
        </g>
      ))}
      <polygon points="42,126 54,96 146,96 158,126" fill={coque} stroke={tokens.ink} strokeWidth="1.5" />
      <circle cx="72" cy="112" r="4" fill={tokens.ink} />
      <circle cx="128" cy="112" r="4" fill={tokens.ink} />
    </svg>
  )
}
