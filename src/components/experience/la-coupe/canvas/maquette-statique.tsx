import { HAUTEUR_REPOS } from './maquette'
import { geometrieMaquette, polygone, type TeinteFace } from './maquette-faces'

/**
 * Rendu statique de la maquette en axonométrie isométrique : sert de
 * placeholder pendant le chargement de three (Phase 2) et de repli sans
 * WebGL ou sous prefers-reduced-motion. La géométrie (faces, emprise, plan
 * de coupe) vient de maquette-faces.ts, partagée avec l'image Open Graph.
 */
const FILLS: Record<TeinteFace, string> = {
  haut: 'var(--paper)',
  est: 'var(--paper-2)',
  sud: '#dcd5c9',
  // L'ombre portée n'est pas dessinée ici (voir plus bas) ; elle sert à l'image Open Graph.
  ombre: 'var(--line)',
  coupe: 'var(--accent)',
}

export default function MaquetteStatique({ className }: { className?: string }) {
  const { faces, viewBox, planCoupe } = geometrieMaquette({ plan: HAUTEUR_REPOS })
  const { minX, minY, largeur, hauteur } = viewBox
  return (
    <svg
      viewBox={`${minX.toFixed(2)} ${minY.toFixed(2)} ${largeur.toFixed(2)} ${hauteur.toFixed(2)}`}
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
      style={{ aspectRatio: `${largeur.toFixed(0)} / ${hauteur.toFixed(0)}` }}
    >
      <g stroke="var(--ink)" strokeOpacity={0.7} strokeWidth={0.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {/* Sans l'ombre portée du socle : la scène 3D n'en a pas, elle disparaîtrait au fondu croisé. */}
        {faces
          .filter((f) => f.teinte !== 'ombre')
          .map((f, i) => (
            <polygon key={i} points={polygone(f.points)} fill={FILLS[f.teinte]} vectorEffect="non-scaling-stroke" />
          ))}
      </g>
      {planCoupe ? (
        <polygon data-plan-coupe points={polygone(planCoupe)} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ) : null}
    </svg>
  )
}
