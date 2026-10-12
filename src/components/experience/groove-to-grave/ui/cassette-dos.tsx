import type { Sortie } from '../content/types'
import { couleurs as tokens } from '../tokens'
import { couleursCassette } from './cassette'

/**
 * Le dos d'une cassette de compilation, en mixtape : la liste des titres écrite à la main sur
 * l'étiquette arrière, proportions de la face avant (200 × 128). Décoratif : la liste des
 * pistes existe en texte sur la page.
 */
export default function CassetteDos({ sortie }: { sortie: Sortie }) {
  const c = couleursCassette(sortie.couleurs)
  const pistes = sortie.tracks.slice(0, 8)
  return (
    <svg viewBox="0 0 200 128" aria-hidden="true" focusable="false" className="g2g-cassette-dos">
      <rect x="2" y="2" width="196" height="124" rx="8" fill={c.coque} stroke={tokens.ink} strokeWidth="2.5" />
      <rect x="14" y="10" width="172" height="108" rx="3" fill={tokens.poster} stroke={tokens.ink} strokeWidth="1.2" />
      <rect x="14" y="10" width="172" height="11" fill={c.bande} />
      <text x="20" y="18.5" fontSize="8" fontWeight="800" fill={c.texteBande} style={{ fontFamily: 'var(--g2g-font-archivo), Archivo, sans-serif', fontStretch: '80%', letterSpacing: 0.3 }}>
        {sortie.catalog} · MIXTAPE
      </text>
      {pistes.map((t, i) => {
        const colonne = i < 4 ? 0 : 1
        const y = 34 + (i % 4) * 20
        const x = 20 + colonne * 86
        return (
          <g key={t.id}>
            <text x={x} y={y} fontSize="7.5" fill={tokens.ink} style={{ fontFamily: 'var(--g2g-font-marker), Permanent Marker, cursive' }}>
              {t.position}. {t.artist ?? sortie.artistName}
            </text>
            <text x={x} y={y + 8} fontSize="6.5" fill={tokens.ink} style={{ fontFamily: 'var(--g2g-font-marker), Permanent Marker, cursive' }}>
              {t.title.length > 22 ? `${t.title.slice(0, 21)}…` : t.title}
            </text>
            <line x1={x} y1={y + 10.5} x2={x + 78} y2={y + 10.5} stroke={tokens.ink} strokeWidth="0.4" strokeDasharray="1 1.5" />
          </g>
        )
      })}
    </svg>
  )
}
