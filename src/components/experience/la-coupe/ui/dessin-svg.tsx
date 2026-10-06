import type { DessinRendu, Epaisseur } from '../lib/dessins'
import DessinAnime from './dessin-anime'
import styles from './dessin-svg.module.css'

interface DessinSvgProps {
  dessin: DessinRendu
  /** Couleur de trait : `ink` sur papier, `paper` sur le footer inversé. */
  encre?: 'ink' | 'paper'
  /** Numéro affiché dans la légende (« 01 — Plan du rez-de-chaussée »). */
  numero?: string
  className?: string
  /** Tracé au scroll (DrawSVG) à l'entrée dans le viewport. */
  anime?: boolean
  /** Sélecteur de l'ancêtre déclencheur du tracé, sinon le dessin. */
  trigger?: string
}

const LARGEURS: Record<Epaisseur, number> = { fort: 1.5, moyen: 0.9, fin: 0.5 }
const TICK = 5

/**
 * Dessin d'architecte en SVG : traits à largeur constante quel que soit le
 * zoom (vector-effect), cotes en HTML positionné en pourcentage pour garder
 * une taille de texte fixe. Statique en Phase 1, tracé au scroll en Phase 3.
 */
export default function DessinSvg({ dessin, encre = 'ink', numero, className, anime = false, trigger }: DessinSvgProps) {
  const couleur = encre === 'ink' ? 'var(--ink)' : 'var(--paper)'
  const couleurCote = encre === 'ink' ? 'var(--ink-2)' : 'var(--ink-2-inverse)'
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`
  return (
    <figure className={[styles.figure, className].filter(Boolean).join(' ')}>
      <div className={styles.cadre} style={{ aspectRatio: `${dessin.largeur} / ${dessin.hauteur}` }}>
        <svg viewBox={dessin.viewBox} className={styles.svg} role="img" aria-label={dessin.legende}>
          <g fill="none" stroke={couleur} strokeLinecap="round" strokeLinejoin="round">
            {dessin.traits.map((t, i) => (
              <path
                key={i}
                d={t.d}
                strokeWidth={LARGEURS[t.epaisseur]}
                vectorEffect="non-scaling-stroke"
                data-epaisseur={t.epaisseur}
                data-tardif={t.tardif || undefined}
              />
            ))}
          </g>
          <g fill="none" stroke={couleurCote} strokeWidth={0.5}>
            {dessin.cotes.map((c, i) => {
              const horizontale = c.orientation === 'horizontale'
              const tick = horizontale
                ? `M${c.x1} ${c.y1 - TICK}v${TICK * 2}M${c.x2} ${c.y2 - TICK}v${TICK * 2}`
                : `M${c.x1 - TICK} ${c.y1}h${TICK * 2}M${c.x2 - TICK} ${c.y2}h${TICK * 2}`
              return (
                <g key={i} data-cote>
                  <path d={`M${c.x1} ${c.y1}L${c.x2} ${c.y2}`} vectorEffect="non-scaling-stroke" />
                  <path d={tick} vectorEffect="non-scaling-stroke" />
                </g>
              )
            })}
          </g>
        </svg>
        {dessin.cotes.map((c, i) =>
          c.orientation === 'horizontale' ? (
            <span
              key={i}
              className={`lc-mono ${styles.cote} ${styles.coteH}`}
              data-cote-label
              style={{ left: pct((c.x1 + c.x2) / 2, dessin.largeur), top: pct(c.y1, dessin.hauteur), color: couleurCote }}
            >
              {c.label}
            </span>
          ) : (
            <span
              key={i}
              className={`lc-mono ${styles.cote} ${styles.coteV}`}
              data-cote-label
              style={{ left: pct(c.x1, dessin.largeur), top: pct((c.y1 + c.y2) / 2, dessin.hauteur), color: couleurCote }}
            >
              {c.label}
            </span>
          ),
        )}
      </div>
      {anime ? <DessinAnime trigger={trigger} /> : null}
      <figcaption className={`lc-mono lc-muted ${styles.legende}`}>
        {numero ? <span className={styles.numero}>{numero}</span> : null}
        {dessin.legende}
      </figcaption>
    </figure>
  )
}
