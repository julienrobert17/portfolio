import { HAUTEUR_COUPE, MAQUETTE, type Volume } from './maquette'
import { profondeur, projeter as projeterMetres } from './projection'

/**
 * Géométrie 2D de la maquette en axonométrie isométrique, sans dépendance au
 * DOM ni à React : partagée par le SVG statique du hero (repli sans WebGL) et
 * par l'image Open Graph générée au build. Peintre : les volumes sont triés
 * du plus lointain au plus proche selon la direction de la caméra, puis par altitude.
 */
const ECHELLE = 24

export type Point = [number, number]

export type TeinteFace = 'haut' | 'est' | 'sud' | 'ombre'

export interface Face {
  points: Point[]
  teinte: TeinteFace
}

export interface GeometrieMaquette {
  /** Faces dans l'ordre de dessin (ombre portée du socle en premier). */
  faces: Face[]
  /** Emprise des faces avec une marge, prête pour l'attribut viewBox. */
  viewBox: { minX: number; minY: number; largeur: number; hauteur: number }
  /** Plan de coupe à mi-hauteur sur l'emprise élargie du socle ; null sans socle. */
  planCoupe: Point[] | null
}

function projeter(x: number, y: number, z: number): Point {
  const [sx, sy] = projeterMetres(x, y, z)
  return [sx * ECHELLE, sy * ECHELLE]
}

/** Sérialise une liste de points pour l'attribut `points` d'un <polygon>. */
export function polygone(points: Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
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

/** Calcule faces, emprise et plan de coupe de la maquette procédurale. */
export function geometrieMaquette(): GeometrieMaquette {
  const volumes = [...MAQUETTE.volumes]
    .filter((v) => v.role !== 'vide' && v.role !== 'escalier')
    .sort((a, b) => profondeur(a.x + a.l / 2, a.y + a.p / 2, 0) - profondeur(b.x + b.l / 2, b.y + b.p / 2, 0) || a.z - b.z)
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
  // Plan de coupe du repli statique, à mi-hauteur, sur l'emprise du socle élargie.
  const zCoupe = HAUTEUR_COUPE / 2
  const m = 0.8
  const planCoupe = socle
    ? [
        projeter(socle.x - m, socle.y - m, zCoupe),
        projeter(socle.x + socle.l + m, socle.y - m, zCoupe),
        projeter(socle.x + socle.l + m, socle.y + socle.p + m, zCoupe),
        projeter(socle.x - m, socle.y + socle.p + m, zCoupe),
      ]
    : null
  return { faces, viewBox: { minX, minY, largeur, hauteur }, planCoupe }
}
