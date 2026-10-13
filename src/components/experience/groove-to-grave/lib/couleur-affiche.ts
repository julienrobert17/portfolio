import { contraste, couleurs as tokens } from '../tokens'

/**
 * Couleur du papier de l'affiche d'un artiste (Phase 7.7). Une seule charte d'en-tête : toutes
 * les pages d'artistes portent l'affiche scotchée, et son papier prend la **dominante relevée sur
 * la pochette** de l'artiste par le pipeline.
 *
 * Garde-fou : une couleur relevée sur une œuvre est arbitraire — elle peut être claire, saturée,
 * ou trop sombre pour porter l'encre. Si elle n'atteint pas le seuil que nous appliquons déjà au
 * texte sur affiche, le site prend **la couleur de palette la plus proche** qui le tient.
 * `tokens.test.ts` passe les dix-neuf affiches réellement en service.
 */
export const MINIMUM_AFFICHE = 4.5

/** Papiers de la palette, candidats au repli : clairs, déjà vérifiés face à l'encre. */
const REPLIS = [tokens.poster, tokens.chromeLight, tokens.chrome, tokens.wall, tokens.lambeauVert, tokens.lambeauRouge] as const

/** Distance entre deux couleurs, canal par canal : sert à choisir le repli le plus proche. */
function canaux(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function distance(a: string, b: string): number {
  const [ar, ag, ab] = canaux(a)
  const [br, bg, bb] = canaux(b)
  return Math.hypot(ar - br, ag - bg, ab - bb)
}

export interface Affiche {
  couleur: string
  rapport: number
  /** Vrai si la dominante de l'œuvre a été écartée au profit d'une couleur de palette. */
  repli: boolean
}

/** Couleur d'affiche pour une dominante donnée : la dominante si elle tient, sinon la plus proche qui tient. */
export function couleurAffiche(dominante?: string): Affiche {
  if (dominante) {
    const rapport = contraste(tokens.ink, dominante)
    if (rapport >= MINIMUM_AFFICHE) return { couleur: dominante, rapport, repli: false }
    const proche = [...REPLIS].filter((c) => contraste(tokens.ink, c) >= MINIMUM_AFFICHE).sort((a, b) => distance(a, dominante) - distance(b, dominante))[0]
    return { couleur: proche, rapport: contraste(tokens.ink, proche), repli: true }
  }
  return { couleur: tokens.poster, rapport: contraste(tokens.ink, tokens.poster), repli: false }
}
