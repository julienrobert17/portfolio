import { HAUTEUR_COUPE, HAUTEUR_REPOS } from '../canvas/maquette'

/**
 * La coupe du hero, de 0 (rien n'est coupé, faîtage) à 1 (au sol). Elle n'est
 * pas pilotée par le scroll : une intro la fait descendre seule jusqu'au
 * repos, où elle reste.
 */
export const COUPE_REPOS = 1 - HAUTEUR_REPOS / HAUTEUR_COUPE

/** Durée de l'intro, en secondes. */
export const DUREE_INTRO = 2.6

/**
 * Courbe de l'intro : vitesse constante depuis le faîtage, puis décélération
 * (power2.out) sur les quarante derniers centimètres, raccordée à la même
 * vitesse. À vitesse constante les dalles sont traversées en moins de 100 ms :
 * jamais de face pleine qui s'attarde à l'écran.
 */
const FREINAGE = 0.4
const COURSE = HAUTEUR_COUPE - HAUTEUR_REPOS
const PART_DROITE = (COURSE - FREINAGE) / COURSE
// Durée du freinage pour que la vitesse soit continue au raccord : power2.out part à la pente 2.
const FIN_DROITE = 1 / (1 + (2 * (1 - PART_DROITE)) / PART_DROITE)

export function courbeIntro(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  if (t <= FIN_DROITE) return (t / FIN_DROITE) * PART_DROITE
  const u = (t - FIN_DROITE) / (1 - FIN_DROITE)
  return PART_DROITE + (1 - PART_DROITE) * (1 - (1 - u) * (1 - u))
}
