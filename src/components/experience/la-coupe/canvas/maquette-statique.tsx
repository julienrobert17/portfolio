import { MAQUETTE, type Volume } from './maquette'

/**
 * Rendu statique de la maquette en axonométrie isométrique : sert de
 * placeholder pendant le chargement de three (Phase 2) et de repli sans
 * WebGL ou sous prefers-reduced-motion. Peintre : les volumes sont dessinés
 * du plus lointain au plus proche (x + y croissant), puis par altitude.
 */
const COS = Math.cos(Math.PI / 6)
const SIN = 0.5
const ECHELLE = 24

type Point = [number, number]

function projeter(x: number, y: number, z: number): Point {
  return [(x - y) * COS * ECHELLE, (x + y) * SIN * ECHELLE - z * ECHELLE]
}

function polygone(points: Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

interface Face {
  points: Point[]
  teinte: 'haut' | 'est' | 'sud' | 'ombre'
}

function facesBoite(v: Volume): Face[] {
  const zt = v.z + v.h
  return [
    { teinte: 'sud', points: [projeter(v.x, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, zt), projeter(v.x, v.y + v.p, zt)] },
    { teinte: 'est', points: [projeter(v.x + v.l, v.y, v.z), projeter(v.x + v.l, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, zt), projeter(v.x + v.l, v.y, zt)] },
    { teinte: 'haut', points: [projeter(v.x, v.y, zt), projeter(v.x + v.l, v.y, zt), projeter(v.x + v.l, v.y + v.p, zt), projeter(v.x, v.y + v.p, zt)] },
  ]
}

function facesToit(v: Volume): Face[] {
  const zt = v.z + v.h
  const ym = v.y + v.p / 2
  return [
    { teinte: 'sud', points: [projeter(v.x, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, v.z), projeter(v.x + v.l, ym, zt), projeter(v.x, ym, zt)] },
    { teinte: 'est', points: [projeter(v.x + v.l, v.y, v.z), projeter(v.x + v.l, v.y + v.p, v.z), projeter(v.x + v.l, ym, zt)] },
  ]
}

const FILLS: Record<Face['teinte'], string> = {
  haut: 'var(--paper)',
  est: 'var(--paper-2)',
  sud: '#dcd5c9',
  ombre: 'var(--line)',
}

export default function MaquetteStatique({ className }: { className?: string }) {
  const volumes = [...MAQUETTE.volumes]
    .filter((v) => v.role !== 'vide')
    .sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z)
  const socle = MAQUETTE.volumes.find((v) => v.role === 'socle')
  const faces: Face[] = []
  if (socle) {
    const d = 1.1
    faces.push({
      teinte: 'ombre',
      points: [
        projeter(socle.x + d, socle.y + d, socle.z),
        projeter(socle.x + socle.l + d, socle.y + d, socle.z),
        projeter(socle.x + socle.l + d, socle.y + socle.p + d, socle.z),
        projeter(socle.x + d, socle.y + socle.p + d, socle.z),
      ],
    })
  }
  for (const v of volumes) faces.push(...(v.role === 'toit' ? facesToit(v) : facesBoite(v)))
  const xs = faces.flatMap((f) => f.points.map((p) => p[0]))
  const ys = faces.flatMap((f) => f.points.map((p) => p[1]))
  const marge = 12
  const minX = Math.min(...xs) - marge
  const minY = Math.min(...ys) - marge
  const largeur = Math.max(...xs) + marge - minX
  const hauteur = Math.max(...ys) + marge - minY
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
    </svg>
  )
}
