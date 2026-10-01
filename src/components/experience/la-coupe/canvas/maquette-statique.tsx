import { HAUTEUR_REPOS } from './maquette'
import { geometrieMaquette, polygone, type Face, type TeinteFace } from './maquette-faces'

/**
 * Rendu statique de la maquette en axonométrie isométrique. Deux rendus du
 * même dessin, dans le même cadre :
 * - `entier` : la maison complète, placeholder du canvas avant l'intro (qui
 *   part du faîtage) et repli du menu ;
 * - `tranche` : la maison coupée à la hauteur de repos, murs en terre cuite,
 *   rien au-dessus du plan. C'est le repli sans WebGL ou sous mouvement
 *   réduit, et le placeholder quand l'intro a déjà joué.
 * La géométrie vient de maquette-faces.ts, partagée avec l'image Open Graph.
 */
const FILLS: Record<TeinteFace, string> = {
  haut: 'var(--paper)',
  est: 'var(--paper-2)',
  sud: '#dcd5c9',
  // L'ombre portée n'est pas dessinée ici (voir plus bas) ; elle sert à l'image Open Graph.
  ombre: 'var(--line)',
  coupe: 'var(--accent)',
}

interface MaquetteStatiqueProps {
  className?: string
  rendu?: 'entier' | 'tranche'
}

const dessiner = (faces: Face[]) =>
  faces
    // Sans l'ombre portée du socle : la scène 3D n'en a pas, elle disparaîtrait au fondu croisé.
    .filter((f) => f.teinte !== 'ombre')
    .map((f, i) => <polygon key={i} points={polygone(f.points)} fill={FILLS[f.teinte]} vectorEffect="non-scaling-stroke" />)

export default function MaquetteStatique({ className, rendu = 'entier' }: MaquetteStatiqueProps) {
  const { faces, viewBox, interieur } = geometrieMaquette(rendu === 'tranche' ? { coupe: HAUTEUR_REPOS, creux: true } : {})
  const { minX, minY, largeur, hauteur } = viewBox
  return (
    <svg
      viewBox={`${minX.toFixed(2)} ${minY.toFixed(2)} ${largeur.toFixed(2)} ${hauteur.toFixed(2)}`}
      className={className}
      data-rendu={rendu}
      role="img"
      aria-hidden="true"
      focusable="false"
      style={{ aspectRatio: `${largeur.toFixed(0)} / ${hauteur.toFixed(0)}` }}
    >
      {interieur ? (
        <clipPath id="lc-ouverture">
          <polygon points={polygone(interieur.ouverture)} />
        </clipPath>
      ) : null}
      <g stroke="var(--ink)" strokeOpacity={0.7} strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {dessiner(faces)}
        {/* L'intérieur, vu par l'ouverture : sol, murs du fond, refends coupés. */}
        {interieur ? <g clipPath="url(#lc-ouverture)">{dessiner(interieur.faces)}</g> : null}
      </g>
    </svg>
  )
}
