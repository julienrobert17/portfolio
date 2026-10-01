import { projets } from '../content/projets'
import { EPAISSEUR_MUR, HAUTEUR_COUPE, MAQUETTE, type Volume } from './maquette'
import { profondeur, projeter as projeterMetres } from './projection'

/**
 * Géométrie 2D de la maquette en axonométrie isométrique, sans dépendance au
 * DOM ni à React : partagée par le SVG statique du hero (repli sans WebGL) et
 * par l'image Open Graph générée au build. Peintre : les volumes sont triés
 * du plus lointain au plus proche selon la direction de la caméra, puis par altitude.
 */
const ECHELLE = 24

export type Point = [number, number]

export type TeinteFace = 'haut' | 'est' | 'sud' | 'ombre' | 'coupe'

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
  /**
   * Intérieur vu par la coupe (option `creux`) : ce qu'on aperçoit par l'ouverture, sol, faces
   * intérieures des murs du fond et refends coupés. À dessiner après `faces`, rogné à `ouverture`.
   */
  interieur: { ouverture: Point[]; faces: Face[] } | null
}

const REFEND = 0.15

function projeter(x: number, y: number, z: number): Point {
  const [sx, sy] = projeterMetres(x, y, z)
  return [sx * ECHELLE, sy * ECHELLE]
}

/** Sérialise une liste de points pour l'attribut `points` d'un <polygon>. */
export function polygone(points: Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
}

function facesBoite(v: Volume, dessus: TeinteFace = 'haut'): Face[] {
  const zt = v.z + v.h
  return [
    { teinte: 'sud', points: [projeter(v.x, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, zt), projeter(v.x, v.y + v.p, zt)] },
    { teinte: 'est', points: [projeter(v.x + v.l, v.y, v.z), projeter(v.x + v.l, v.y + v.p, v.z), projeter(v.x + v.l, v.y + v.p, zt), projeter(v.x + v.l, v.y, zt)] },
    { teinte: dessus, points: [projeter(v.x, v.y, zt), projeter(v.x + v.l, v.y, zt), projeter(v.x + v.l, v.y + v.p, zt), projeter(v.x, v.y + v.p, zt)] },
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

/**
 * Calcule faces, emprise et plan de coupe de la maquette procédurale.
 * `coupe` (mètres) tranche la maquette : ce qui est au-dessus disparaît, les
 * volumes traversés sont tronqués et leur dessus prend la teinte `coupe`
 * (terre cuite). Sert à la tuile du carrousel du portfolio.
 *
 * `creux` (repli statique du hero) montre en plus l'intérieur par l'ouverture : seuls les murs
 * restent en terre cuite, comme dans la scène 3D au repos. Le cadre est alors celui de la maquette
 * entière, pour que les deux rendus du hero se superposent exactement.
 */
export function geometrieMaquette(options: { coupe?: number; plan?: number; creux?: boolean } = {}): GeometrieMaquette {
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
  const { coupe } = options
  for (const v of volumes) {
    if (coupe !== undefined && v.z >= coupe) continue
    if (coupe !== undefined && v.z + v.h > coupe) {
      // Traversé par la coupe : tronqué, dessus en face coupée (un toit tranché se lit comme un bloc).
      faces.push(...facesBoite({ ...v, h: coupe - v.z }, 'coupe'))
      continue
    }
    faces.push(...(v.role === 'toit' ? facesToit(v) : facesBoite(v)))
  }
  let interieur: GeometrieMaquette['interieur'] = null
  if (options.creux && coupe !== undefined && socle && coupe > 0 && coupe < socle.z + socle.h) {
    const e = EPAISSEUR_MUR
    const x0 = socle.x + e
    const y0 = socle.y + e
    const x1 = socle.x + socle.l - e
    const y1 = socle.y + socle.p - e
    const murs = projets.find((p) => p.slug === 'maison-des-vignes')?.dessins.find((d) => d.type === 'plan')?.murs ?? []
    const refends = murs
      .map(([ax, ay, bx, by]): Volume => {
        const vertical = ax === bx
        return vertical
          ? { role: 'socle', x: ax - REFEND / 2, y: Math.max(y0, Math.min(ay, by)), l: REFEND, p: Math.min(y1, Math.max(ay, by)) - Math.max(y0, Math.min(ay, by)), z: 0, h: coupe }
          : { role: 'socle', x: Math.max(x0, Math.min(ax, bx)), y: ay - REFEND / 2, l: Math.min(x1, Math.max(ax, bx)) - Math.max(x0, Math.min(ax, bx)), p: REFEND, z: 0, h: coupe }
      })
      .sort((a, b) => profondeur(a.x + a.l / 2, a.y + a.p / 2, 0) - profondeur(b.x + b.l / 2, b.y + b.p / 2, 0))
    interieur = {
      ouverture: [projeter(x0, y0, coupe), projeter(x1, y0, coupe), projeter(x1, y1, coupe), projeter(x0, y1, coupe)],
      faces: [
        // Le sol, puis les faces intérieures des deux murs du fond (nord et ouest), les seules visibles.
        { teinte: 'haut', points: [projeter(x0, y0, 0), projeter(x1, y0, 0), projeter(x1, y1, 0), projeter(x0, y1, 0)] },
        { teinte: 'sud', points: [projeter(x0, y0, 0), projeter(x1, y0, 0), projeter(x1, y0, coupe), projeter(x0, y0, coupe)] },
        { teinte: 'est', points: [projeter(x0, y0, 0), projeter(x0, y1, 0), projeter(x0, y1, coupe), projeter(x0, y0, coupe)] },
        ...refends.flatMap((r) => facesBoite(r, 'coupe')),
      ],
    }
  }
  // Cadre : celui des faces dessinées, ou de la maquette entière quand les deux rendus se superposent.
  const cadre = options.creux ? geometrieMaquette().faces : faces
  const xs = cadre.flatMap((f) => f.points.map((p) => p[0]))
  const ys = cadre.flatMap((f) => f.points.map((p) => p[1]))
  const marge = 12
  const minX = Math.min(...xs) - marge
  const minY = Math.min(...ys) - marge
  const largeur = Math.max(...xs) + marge - minX
  const hauteur = Math.max(...ys) + marge - minY
  // Plan de coupe du repli statique, sur l'emprise du socle élargie : à mi-hauteur par défaut
  // (image Open Graph), à la hauteur de repos du hero quand `plan` la donne.
  const zCoupe = options.plan ?? HAUTEUR_COUPE / 2
  const m = 0.8
  const planCoupe = socle
    ? [
        projeter(socle.x - m, socle.y - m, zCoupe),
        projeter(socle.x + socle.l + m, socle.y - m, zCoupe),
        projeter(socle.x + socle.l + m, socle.y + socle.p + m, zCoupe),
        projeter(socle.x - m, socle.y + socle.p + m, zCoupe),
      ]
    : null
  return { faces, viewBox: { minX, minY, largeur, hauteur }, planCoupe, interieur }
}
