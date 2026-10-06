import type { CSSProperties } from 'react'
import { site } from '../content/site'
import DessinTrace from '../ui/dessin-trace'
import styles from './contact-plan.module.css'

/** Repère du plan, en unités SVG (1 unité ≈ 0,5 m). */
const L = 600
const H = 500

type Epaisseur = 'fort' | 'moyen' | 'fin'

interface Trait {
  d: string
  epaisseur: Epaisseur
  /** Tracé en dernier : parcours et repères. */
  tardif?: boolean
  accent?: boolean
}

const LARGEURS: Record<Epaisseur, number> = { fort: 1.5, moyen: 0.9, fin: 0.5 }

/** Cercle en path (DrawSVG et l'ordre de tracé ne connaissent que les paths). */
const cercle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`

/** Stations : hors plan, signalées en bout de rue. `aGauche` : libellé à gauche du repère. */
const STATIONS: Record<string, { x: number; y: number; parcours: string; aGauche: boolean }> = {
  glaciere: { x: 20, y: 350, parcours: 'M27 350H260V300', aGauche: false },
  gobelins: { x: 488, y: 20, parcours: 'M488 27V350H266', aGauche: true },
}

const TRAITS: Trait[] = [
  // Îlot du 12 (ouvert au droit du porche) et atelier au fond de la cour.
  { d: 'M0 86H464V324H276M244 324H0', epaisseur: 'fort' },
  { d: 'M190 126H330V180H190Z', epaisseur: 'fort' },
  // Cour, porche, îlots voisins.
  { d: 'M190 180V292H330V180', epaisseur: 'moyen' },
  { d: 'M244 324V292M276 324V292', epaisseur: 'moyen' },
  { d: 'M512 0V324H600M512 500V376H600M464 500V376H0', epaisseur: 'moyen' },
  // Bordures de trottoir et mitoyens.
  { d: 'M0 330H470M506 330H600M0 370H470M506 370H600M470 0V330M470 370V500M506 0V330M506 370V500', epaisseur: 'fin' },
  { d: 'M140 86V324M0 206H140M60 86V206M372 86V324M372 220H464M140 126H190M420 220V324', epaisseur: 'fin' },
  // Nord.
  { d: 'M560 480V440M553 451l7-11 7 11', epaisseur: 'moyen', tardif: true },
  // Point de l'atelier et son rappel vers le libellé.
  { d: `${cercle(260, 153, 9)}M260 144V58`, epaisseur: 'fort', tardif: true, accent: true },
]

const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`
const en = (x: number, y: number): CSSProperties => ({ left: pct(x, L), top: pct(y, H) })

/**
 * Plan de situation dessiné à la main dans le langage des fiches : traits à
 * largeur constante, libellés mono en HTML positionnés en pourcentage (taille
 * de texte fixe), tracé au scroll par `DessinTrace` (forts, moyens, fins, puis
 * parcours et repères, enfin l'échelle et les libellés). Le cadre réserve son
 * ratio : aucun décalage. Sans JavaScript, le plan est complet.
 */
export default function ContactPlan() {
  const { plan, stations } = site.contact.venir
  return (
    <figure className={styles.figure} data-plan>
      <div className={styles.cadre} style={{ aspectRatio: `${L} / ${H}` }}>
        <svg viewBox={`0 0 ${L} ${H}`} className={styles.svg} role="img" aria-label={plan.alt}>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {TRAITS.map((t) => (
              <path
                key={t.d}
                d={t.d}
                stroke={t.accent ? 'var(--accent)' : 'var(--ink)'}
                strokeWidth={LARGEURS[t.epaisseur]}
                vectorEffect="non-scaling-stroke"
                data-epaisseur={t.epaisseur}
                data-tardif={t.tardif || undefined}
              />
            ))}
            {stations.map((s) => {
              const repere = STATIONS[s.id]
              return repere ? (
                <path
                  key={s.id}
                  d={`${cercle(repere.x, repere.y, 7)}${repere.parcours}`}
                  stroke="var(--accent)"
                  strokeWidth={LARGEURS.moyen}
                  vectorEffect="non-scaling-stroke"
                  data-epaisseur="moyen"
                  data-tardif
                />
              ) : null
            })}
          </g>
          <g fill="none" stroke="var(--ink-2)" strokeWidth={0.5} data-cote>
            <path d="M40 455H140" vectorEffect="non-scaling-stroke" />
            <path d="M40 450v10M140 450v10" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        {/* Libellés décoratifs pour les lecteurs d'écran : l'alternative du plan et la table disent la même chose. */}
        <div className={`lc-mono ${styles.libelles}`} aria-hidden="true">
          {/* À gauche du rappel : à 320 px de large, centré, il toucherait le libellé des Gobelins. */}
          <span className={`${styles.libelle} ${styles.gaucheBas} ${styles.accent}`} data-cote-label style={en(252, 84)}>
            {plan.atelier}
          </span>
          <span className={`${styles.libelle} ${styles.centre}`} data-cote-label style={en(260, 236)}>
            {plan.cour}
          </span>
          <span className={styles.libelle} data-cote-label style={en(200, 382)}>
            {plan.rue}
          </span>
          {stations.map((s) => {
            const repere = STATIONS[s.id]
            return repere ? (
              <span
                key={s.id}
                className={`${styles.libelle} ${styles.station} ${repere.aGauche ? styles.aGauche : ''}`}
                data-cote-label
                style={repere.aGauche ? en(repere.x - 22, repere.y - 14) : en(repere.x - 20, repere.y + 32)}
              >
                <span className={styles.nom}>{s.nom}</span>
                <span>
                  {s.ligne} · {s.marche}
                </span>
              </span>
            ) : null
          })}
          <span className={`${styles.libelle} ${styles.centreBas}`} data-cote-label style={en(560, 436)}>
            {plan.nord}
          </span>
          <span className={`${styles.libelle} ${styles.centreHaut}`} data-cote-label style={en(90, 462)}>
            {plan.echelle}
          </span>
        </div>
      </div>
      <DessinTrace conteneur="[data-plan]" duree={2} />
      <figcaption className={`lc-mono lc-muted ${styles.legende}`}>{plan.legende}</figcaption>
    </figure>
  )
}
