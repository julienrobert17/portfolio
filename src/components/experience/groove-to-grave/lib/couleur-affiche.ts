import { contraste, couleurs as tokens, luminance } from '../tokens'

/**
 * Couleur du papier de l'affiche d'un artiste (Phase 7.7, revue en 7.8). Une seule charte
 * d'en-tête : toutes les pages d'artistes portent l'affiche scotchée, et son papier vient de la
 * **dominante relevée sur la pochette** de l'artiste par le pipeline.
 *
 * Une dominante relevée sur une œuvre ne porte pas toujours l'encre. La règle de 7.7 — basculer
 * sur la couleur de palette la plus proche — rendait dix pages identiques et effaçait le lien avec
 * l'œuvre ; celle de 7.8 — éclaircir à teinte constante — gardait la teinte mais **trahissait la
 * valeur** : les pochettes sombres devenaient pâles et le mur perdait ses ancres. Depuis la Phase
 * 7.10, **la luminance de la dominante décide du traitement** : une dominante claire est éclaircie
 * et porte l'encre ; une dominante sombre est **assombrie** et porte le papier. Le rapport reste le
 * juge dans les deux cas.
 *
 * Garde-fous : le rapport reste le juge (`MINIMUM_AFFICHE`, voir le seuil et son arbitrage au
 * brief) ; la saturation est plafonnée pour que dix-neuf papiers éclaircis ne virent pas au néon ;
 * et si une dominante ne tient pas le rapport même éclaircie dans ces limites (teinte quasi
 * neutre), **la palette reprend la main**. `tokens.test.ts` passe les dix-neuf affiches en service
 * et dit, pour chacune, la dominante d'origine, le papier retenu et son rapport.
 */

/** Seuil appliqué au papier d'affiche : du texte de 24 px et plus, en gras, et rien d'autre. */
export const MINIMUM_AFFICHE = 4.5
/**
 * Seuil du petit texte sur papier échantillonné : celui du brief pour le texte courant. C'est le
 * seuil de la **tuile du mur des artistes** (Phase 7.9), qui porte un nom et une ligne de rôle —
 * et celui qui s'appliquerait si un petit texte se posait un jour sur l'affiche d'une page.
 */
export const MINIMUM_AFFICHE_PETIT_TEXTE = 7
/** Plafond de saturation du papier éclairci : au-delà, la couleur crie au lieu de porter le nom. */
export const SATURATION_MAX = 0.55
/** Plafond de clarté : au-delà, ce n'est plus la couleur de l'œuvre, c'est du blanc. */
export const CLARTE_MAX = 0.92
/** Plancher de clarté : en deçà, ce n'est plus la couleur de l'œuvre, c'est du noir. */
export const CLARTE_MIN = 0.05
/**
 * Luminance de bascule entre les deux traitements (Phase 7.10). Ce n'est pas un chiffre choisi :
 * c'est le point où une couleur contraste autant avec l'encre qu'avec le papier, `√((Lpapier +
 * 0,05)(Lencre + 0,05)) − 0,05`. En dessous, la couleur est du côté sombre et le papier sera son
 * texte ; au-dessus, elle est du côté clair et porte l'encre. Déplacer ce seuil déplace la
 * frontière, sans toucher à la règle.
 */
export const LUMINANCE_BASCULE = Math.sqrt((luminance(tokens.poster) + 0.05) * (luminance(tokens.ink) + 0.05)) - 0.05

/** Papiers de la palette, dernier recours côté clair : déjà vérifiés face à l'encre. */
const REPLIS_CLAIRS = [tokens.poster, tokens.chromeLight, tokens.chrome, tokens.wall, tokens.lambeauVert, tokens.lambeauRouge] as const
/** Aplats de la palette, dernier recours côté sombre : déjà vérifiés face au papier. */
const REPLIS_SOMBRES = [tokens.ink, tokens.greenDeep, tokens.lcdOff, tokens.papierSombre] as const

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
  /** Couleur du texte posé dessus : l'encre côté clair, le papier côté sombre. */
  encre: string
  rapport: number
  /** D'où vient la couleur : la dominante telle quelle, éclaircie, assombrie, ou la palette. */
  origine: 'dominante' | 'eclaircie' | 'assombrie' | 'palette'
}

/**
 * Couleur tirée d'une dominante pour un seuil donné, et couleur du texte qui va dessus.
 * Deux tons sortent de la même teinte (Phase 7.9) : l'affiche d'une page à `MINIMUM_AFFICHE`,
 * la tuile du mur à `MINIMUM_AFFICHE_PETIT_TEXTE`, parce qu'elle porte un petit texte. Et deux
 * traitements (Phase 7.10) : éclaircir vers l'encre, ou assombrir vers le papier.
 */
export function couleurAffiche(dominante?: string, minimum: number = MINIMUM_AFFICHE): Affiche {
  if (!dominante) return { couleur: tokens.poster, encre: tokens.ink, rapport: contraste(tokens.ink, tokens.poster), origine: 'dominante' }
  const sombre = luminance(dominante) < LUMINANCE_BASCULE
  const encre = sombre ? tokens.poster : tokens.ink
  const rapportBrut = contraste(encre, dominante)
  if (rapportBrut >= minimum) return { couleur: dominante, encre, rapport: rapportBrut, origine: 'dominante' }
  const [t, s, l] = versHsl(dominante)
  const saturation = Math.min(s, SATURATION_MAX)
  // Le contraste croît en s'éloignant du texte : on s'en éloigne par pas de 1 % de clarté.
  const pas = sombre ? -0.01 : 0.01
  const butee = sombre ? CLARTE_MIN : CLARTE_MAX
  for (let clarte = l; sombre ? clarte >= butee - 1e-9 : clarte <= butee + 1e-9; clarte += pas) {
    const essai = versHex(t, saturation, sombre ? Math.max(clarte, butee) : Math.min(clarte, butee))
    const rapport = contraste(encre, essai)
    if (rapport >= minimum) return { couleur: essai, encre, rapport, origine: sombre ? 'assombrie' : 'eclaircie' }
  }
  const replis = sombre ? REPLIS_SOMBRES : REPLIS_CLAIRS
  const proche = [...replis].filter((c) => contraste(encre, c) >= minimum).sort((a, b) => distance(a, dominante) - distance(b, dominante))[0] ?? (sombre ? tokens.ink : tokens.poster)
  return { couleur: proche, encre, rapport: contraste(encre, proche), origine: 'palette' }
}
