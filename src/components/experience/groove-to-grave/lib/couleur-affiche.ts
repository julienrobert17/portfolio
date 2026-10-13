import { contraste, couleurs as tokens } from '../tokens'

/**
 * Couleur du papier de l'affiche d'un artiste (Phase 7.7, revue en 7.8). Une seule charte
 * d'en-tête : toutes les pages d'artistes portent l'affiche scotchée, et son papier vient de la
 * **dominante relevée sur la pochette** de l'artiste par le pipeline.
 *
 * Une dominante relevée sur une œuvre est souvent trop sombre pour porter l'encre. La règle de
 * 7.7 — basculer sur la couleur de palette la plus proche — rendait dix pages identiques et
 * effaçait le lien avec l'œuvre. Depuis 7.8, **la dominante est éclaircie à teinte constante**
 * jusqu'à ce que le rapport soit atteint : la couleur de la pochette reste reconnaissable.
 *
 * Garde-fous : le rapport reste le juge (`MINIMUM_AFFICHE`, voir le seuil et son arbitrage au
 * brief) ; la saturation est plafonnée pour que dix-neuf papiers éclaircis ne virent pas au néon ;
 * et si une dominante ne tient pas le rapport même éclaircie dans ces limites (teinte quasi
 * neutre), **la palette reprend la main**. `tokens.test.ts` passe les dix-neuf affiches en service
 * et dit, pour chacune, la dominante d'origine, le papier retenu et son rapport.
 */

/** Seuil appliqué au papier d'affiche : du texte de 24 px et plus, en gras, et rien d'autre. */
export const MINIMUM_AFFICHE = 4.5
/** Seuil qui s'appliquerait si un texte courant se posait un jour sur l'affiche (brief §3.1). */
export const MINIMUM_AFFICHE_PETIT_TEXTE = 7
/** Plafond de saturation du papier éclairci : au-delà, la couleur crie au lieu de porter le nom. */
export const SATURATION_MAX = 0.55
/** Plafond de clarté : au-delà, ce n'est plus la couleur de l'œuvre, c'est du blanc. */
export const CLARTE_MAX = 0.92

/** Papiers de la palette, dernier recours : clairs, déjà vérifiés face à l'encre. */
const REPLIS = [tokens.poster, tokens.chromeLight, tokens.chrome, tokens.wall, tokens.lambeauVert, tokens.lambeauRouge] as const

function canaux(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function distance(a: string, b: string): number {
  const [ar, ag, ab] = canaux(a)
  const [br, bg, bb] = canaux(b)
  return Math.hypot(ar - br, ag - bg, ab - bb)
}

/** Teinte, saturation, clarté (0 à 1) d'une couleur hexadécimale. */
export function versHsl(hex: string): [number, number, number] {
  const [r, v, b] = canaux(hex).map((c) => c / 255)
  const max = Math.max(r, v, b)
  const min = Math.min(r, v, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const t = max === r ? (v - b) / d + (v < b ? 6 : 0) : max === v ? (b - r) / d + 2 : (r - v) / d + 4
  return [t / 6, s, l]
}

/** Retour en hexadécimal, canaux arrondis. */
export function versHex(t: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + t * 12) % 12
    const a = s * Math.min(l, 1 - l)
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * v)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export interface Affiche {
  couleur: string
  rapport: number
  /** D'où vient le papier : la dominante telle quelle, la dominante éclaircie, ou la palette. */
  origine: 'dominante' | 'eclaircie' | 'palette'
}

/** Couleur d'affiche pour une dominante : telle quelle, éclaircie à teinte constante, ou de palette. */
export function couleurAffiche(dominante?: string): Affiche {
  if (!dominante) return { couleur: tokens.poster, rapport: contraste(tokens.ink, tokens.poster), origine: 'dominante' }
  const rapportBrut = contraste(tokens.ink, dominante)
  if (rapportBrut >= MINIMUM_AFFICHE) return { couleur: dominante, rapport: rapportBrut, origine: 'dominante' }
  const [t, s, l] = versHsl(dominante)
  const saturation = Math.min(s, SATURATION_MAX)
  // Le contraste avec l'encre croît avec la clarté : on monte par pas de 1 % jusqu'au premier qui tient.
  for (let clarte = l; clarte <= CLARTE_MAX + 1e-9; clarte += 0.01) {
    const essai = versHex(t, saturation, Math.min(clarte, CLARTE_MAX))
    const rapport = contraste(tokens.ink, essai)
    if (rapport >= MINIMUM_AFFICHE) return { couleur: essai, rapport, origine: 'eclaircie' }
  }
  const proche = [...REPLIS].filter((c) => contraste(tokens.ink, c) >= MINIMUM_AFFICHE).sort((a, b) => distance(a, dominante) - distance(b, dominante))[0]
  return { couleur: proche, rapport: contraste(tokens.ink, proche), origine: 'palette' }
}
