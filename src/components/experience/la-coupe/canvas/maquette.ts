/**
 * Maquette procédurale du projet phare (Maison des Vignes), en mètres.
 * Sert au rendu statique SVG (Phase 1) puis à l'extrusion R3F (Phase 2).
 * Origine : angle nord-ouest du socle, au niveau du sol fini.
 */
export type RoleVolume = 'socle' | 'etage' | 'escalier' | 'vide' | 'toit'

export interface Volume {
  role: RoleVolume
  x: number
  y: number
  /** Longueur selon x, profondeur selon y. */
  l: number
  p: number
  /** Altitude de la base et hauteur. */
  z: number
  h: number
}

export const MAQUETTE = {
  /** Sous-sol enterré, sous le niveau 0. */
  enterre: 1.2,
  volumes: [
    { role: 'socle', x: 0, y: 0, l: 18, p: 11, z: -1.2, h: 4.4 },
    { role: 'etage', x: 4, y: 1, l: 14, p: 9, z: 3.2, h: 3.0 },
    { role: 'toit', x: 4, y: 1, l: 14, p: 9, z: 6.2, h: 2.6 },
    { role: 'escalier', x: 0, y: 8, l: 3, p: 3, z: 3.2, h: 6.0 },
    { role: 'vide', x: 6, y: 4, l: 3, p: 3, z: 6.2, h: 0 },
  ] satisfies Volume[],
} as const

/** Hauteur totale de la coupe, du sol au point le plus haut. */
export const HAUTEUR_COUPE = Math.max(...MAQUETTE.volumes.map((v) => v.z + v.h))

/** Point d'entrée pour un futur .glb (Draco). Retourne null tant qu'il n'existe pas. */
export async function loadModel(): Promise<null> {
  return null
}
