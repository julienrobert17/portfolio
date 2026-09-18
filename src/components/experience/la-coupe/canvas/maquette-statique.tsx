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
  ombre: 'var(--line)',
}

export default function MaquetteStatique({ className }: { className?: string }) {
  const { faces, viewBox, planCoupe } = geometrieMaquette()
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
        {faces.map((f, i) => (
          <polygon
            key={i}
            points={polygone(f.points)}
            fill={FILLS[f.teinte]}
            stroke={f.teinte === 'ombre' ? 'none' : undefined}
            fillOpacity={f.teinte === 'ombre' ? 0.45 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {planCoupe ? (
        <polygon data-plan-coupe points={polygone(planCoupe)} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ) : null}
    </svg>
  )
}
