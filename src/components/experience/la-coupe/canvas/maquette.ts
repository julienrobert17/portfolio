import type { DescripteurCoupe, DescripteurPlan, Segment } from '../content/types'

/**
 * Maquette procédurale du projet phare (Maison des Vignes), en mètres.
 * Source unique : le rendu SVG statique, la scène R3F et les dessins de la
 * fiche (plan, coupe) en dérivent, pour qu'aucune cote ne diverge.
 * Origine : angle nord-ouest du socle, au niveau du sol fini. z vers le haut.
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

export const EPAISSEUR_DALLE = 0.25
export const EPAISSEUR_MUR = 0.3

const SOCLE: Volume = { role: 'socle', x: 0, y: 0, l: 18, p: 11, z: -1.2, h: 4.4 }
const ETAGE: Volume = { role: 'etage', x: 4, y: 1, l: 14, p: 9, z: 3.2, h: 3.0 }
const TOIT: Volume = { role: 'toit', x: 4, y: 1, l: 14, p: 9, z: 6.2, h: 2.6 }
/** Cage d'escalier dans le vide, sous le toit : invisible en volume, révélée par la coupe. */
const ESCALIER: Volume = { role: 'escalier', x: 6, y: 4, l: 3, p: 3, z: 0, h: 7.8 }
const VIDE: Volume = { role: 'vide', x: 6, y: 4, l: 3, p: 3, z: 3.2, h: 3.0 }

export const MAQUETTE = {
  /** Sous-sol enterré, sous le niveau 0. */
  enterre: -SOCLE.z,
  socle: SOCLE,
  etage: ETAGE,
  toit: TOIT,
  escalier: ESCALIER,
  vide: VIDE,
  volumes: [SOCLE, ETAGE, TOIT, ESCALIER, VIDE] as readonly Volume[],
}

/** Hauteur totale de la coupe, du sol au point le plus haut (le faîtage). */
export const HAUTEUR_COUPE = Math.max(...MAQUETTE.volumes.map((v) => v.z + v.h))

/** Coupe transversale de la fiche, dérivée des volumes : même hauteur que le hero. */
export function coupeDepuisMaquette(legende: string): DescripteurCoupe {
  return {
    type: 'coupe',
    largeur: SOCLE.l,
    niveaux: [SOCLE.z + SOCLE.h - EPAISSEUR_DALLE, ETAGE.h - EPAISSEUR_DALLE],
    toit: 'deux-pentes',
    hauteurToit: TOIT.h,
    enterre: MAQUETTE.enterre,
    vide: [VIDE.x, VIDE.x + VIDE.l],
    legende,
  }
}

/** Plan du rez-de-chaussée : l'emprise est celle du socle, les refends sont donnés. */
export function planDepuisMaquette(murs: Segment[], ouvertures: [number, number][], legende: string): DescripteurPlan {
  return { type: 'plan', largeur: SOCLE.l, profondeur: SOCLE.p, murs, ouvertures, legende }
}

/** Point d'entrée pour un futur .glb (Draco). Retourne null tant qu'il n'existe pas. */
export async function loadModel(): Promise<null> {
  return null
}
