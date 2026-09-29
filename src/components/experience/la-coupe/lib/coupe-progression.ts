import { HAUTEUR_COUPE, MAQUETTE } from '../canvas/maquette'

/**
 * Du scroll à la coupe. `course` et `coupe` vont de 0 à 1 : 0, rien n'est
 * coupé (faîtage) ; 1, la coupe est au sol.
 *
 * La courbe traverse le toit vite, les 30 % supérieurs de la hauteur en 15 %
 * de course, puis descend en ligne droite jusqu'au sol : pas de ralenti sur
 * les étages. Le premier tronçon est une parabole qui rejoint la droite avec
 * sa pente, sans cassure.
 */
const COURSE_TOIT = 0.15
const COUPE_TOIT = 0.3
const PENTE = (1 - COUPE_TOIT) / (1 - COURSE_TOIT)
// a·t² + b·t, passant par (COURSE_TOIT, COUPE_TOIT) avec la pente de la droite.
const A = (PENTE * COURSE_TOIT - COUPE_TOIT) / (COURSE_TOIT * COURSE_TOIT)
const B = PENTE - 2 * A * COURSE_TOIT

const borner = (v: number) => Math.min(1, Math.max(0, v))

export function courbe(course: number): number {
  const t = borner(course)
  return t < COURSE_TOIT ? A * t * t + B * t : COUPE_TOIT + (t - COURSE_TOIT) * PENTE
}

export function courbeInverse(coupe: number): number {
  const c = borner(coupe)
  if (c >= COUPE_TOIT) return COURSE_TOIT + (c - COUPE_TOIT) / PENTE
  return (-B + Math.sqrt(B * B + 4 * A * c)) / (2 * A)
}

/**
 * Fin de l'intro, et état de repos du hero : la coupe au plancher du premier
 * niveau. Trois centimètres au-dessus de la dalle, jamais coplanaire avec sa
 * face supérieure (le stencil scintillerait).
 */
export const COUPE_REPOS = 1 - (MAQUETTE.etage.z + 0.03) / HAUTEUR_COUPE

/**
 * Origine de la course pour que la position de scroll `course` donne la
 * coupe `coupe` : la course restante est remise à l'échelle sur la même
 * courbe. Bornée à 0 quand le scroll a déjà dépassé la coupe (il faudra la
 * rattraper, jamais revenir en arrière).
 */
export function origineDe(coupe: number, course: number): number {
  if (course >= 1) return 0
  return borner((courbeInverse(coupe) - course) / (1 - course))
}

export const coupeDe = (origine: number, course: number): number => courbe(origine + (1 - origine) * borner(course))
