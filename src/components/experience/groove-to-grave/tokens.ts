import type { CSSProperties } from 'react'

/**
 * Tokens de « Groove To Grave » : palette relevée sur les pochettes et les flyers du label
 * (passe d'identité du 10 octobre 2026), exposée en variables CSS `--g2g-<token>` par
 * `variablesCss()`. Les paires texte/fond autorisées sont listées dans `PAIRES` et vérifiées
 * par tokens.test.ts (`npm run test:g2g-tokens`). Brief §3.1.
 */
/** Mélange linéaire en sRGB de `a` vers `b`, `t` entre 0 et 1, en hexadécimal. */
export function melanger(a: string, b: string, t: number): string {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const canal = (d: number) => Math.round(((na >> d) & 255) * (1 - t) + ((nb >> d) & 255) * t)
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}

/** Assombrit une couleur d'un facteur multiplicatif puis d'un retrait constant (0 à 1), en hexadécimal. */
function assombrir(hex: string, facteur: number, retrait: number): string {
  const n = parseInt(hex.slice(1), 16)
  const canal = (d: number) => Math.max(0, Math.round(((n >> d) & 255) * facteur - retrait * 255))
  return `#${[16, 8, 0].map((d) => canal(d).toString(16).padStart(2, '0')).join('')}`
}

const WALL = '#efe6d2'
const RED = '#f14442'
const GREEN = '#268459'

/** Part de red ou de green dans un lambeau d'affiche du mur : 35 % au plus (passe de direction 4.1). */
export const MELANGE_LAMBEAU = 0.35

/**
 * Grain le plus sombre du papier du mur, tenu en phase avec canvas/mur-shader.ts : facteur
 * minimal de la lumière, des plis fins, de la colle et du voile final (0,93 × 0,94 × 0,92 × 0,97)
 * et retrait maximal du grain (0,035). Le shader ne descend jamais sous ce produit.
 */
export const PAPIER_SOMBRE = { facteur: 0.93 * 0.94 * 0.92 * 0.97, retrait: 0.035 }

/**
 * Lambeaux du mur, tenus en phase avec le shader : relief minimal 0,98, grain de 0,021 au plus,
 * trame d'impression (points ou filets) à 0,9, liseré de bord à 0,9. La trame et le liseré ne
 * se superposent jamais.
 */
export const LAMBEAU = { relief: 0.98, grain: 0.021, trame: 0.9, lisere: 0.9 }

const LAMBEAU_ROUGE = melanger(WALL, RED, MELANGE_LAMBEAU)
const LAMBEAU_VERT = melanger(WALL, GREEN, MELANGE_LAMBEAU)
/** Le lambeau le moins lumineux, sur lequel trame et liseré sont les plus sombres. */
const LAMBEAU_SOMBRE = luminance(LAMBEAU_ROUGE) < luminance(LAMBEAU_VERT) ? LAMBEAU_ROUGE : LAMBEAU_VERT

export const couleurs = {
  /** Fond du mur, papier d'affichage. */
  wall: WALL,
  /** Lambeau d'affiche rouge du mur : wall mêlé de red à 35 %. */
  lambeauRouge: LAMBEAU_ROUGE,
  /** Lambeau d'affiche vert du mur : wall mêlé de green à 35 %. */
  lambeauVert: LAMBEAU_VERT,
  /** Trame d'impression (points ou filets) d'un lambeau, à son plus sombre (dérivé du shader, voir LAMBEAU). */
  trameSombre: assombrir(LAMBEAU_SOMBRE, LAMBEAU.relief * LAMBEAU.trame, LAMBEAU.grain),
  /** Liseré de bord d'un lambeau, à son plus sombre (dérivé du shader, voir LAMBEAU). */
  lisereSombre: assombrir(LAMBEAU_SOMBRE, LAMBEAU.relief * LAMBEAU.lisere, LAMBEAU.grain),
  /** Le papier du mur à son grain le plus sombre (dérivé du shader, voir PAPIER_SOMBRE). */
  papierSombre: assombrir(WALL, PAPIER_SOMBRE.facteur, PAPIER_SOMBRE.retrait),
  /** Affiches, étiquettes de cassette, texte clair sur fonds sombres. */
  poster: '#faf4e6',
  /** Texte, traits, contours. */
  ink: '#111111',
  /** Aplats et éléments graphiques, relevé sur GTGRVA01. Jamais en texte sur fond clair. */
  red: RED,
  /** Texte rouge sur fond clair. */
  redInk: '#c21e19',
  /** Aplats et éléments graphiques, relevé sur GTGRVA02. Jamais en texte sur fond clair. */
  green: GREEN,
  /** Fond vert sous texte clair. */
  greenDeep: '#1d6b47',
  /** Corps du lecteur. */
  chrome: '#e4dccb',
  /** Boutons et barres du lecteur. */
  chromeLight: '#f3ecdc',
  /** Fond de l'afficheur. */
  lcd: '#111111',
  /** Segments allumés et texte de l'afficheur. */
  lcdLit: '#f6efe0',
  /** Segments de crête. */
  lcdPeak: '#f14442',
  /** Segments éteints. */
  lcdOff: '#2a2722',
  /** Libellés de l'afficheur. */
  lcdDim: '#8a8270',
} as const

export type Token = keyof typeof couleurs

export interface Paire {
  texte: Token
  fond: Token
  /** 7 pour le texte posé sur le mur WebGL ; 4,5 pour le texte courant ; 3 pour le texte de 24 px et plus et les éléments d'interface. */
  minimum: 7 | 4.5 | 3
  usage: string
}

/** Chaque paire texte/fond utilisée par le site. Toute nouvelle paire s'ajoute ici avant d'être utilisée. */
export const PAIRES: Paire[] = [
  { texte: 'ink', fond: 'wall', minimum: 7, usage: 'texte courant sur le mur' },
  { texte: 'ink', fond: 'lambeauRouge', minimum: 7, usage: 'texte sur un lambeau rouge du mur' },
  { texte: 'ink', fond: 'lambeauVert', minimum: 7, usage: 'texte sur un lambeau vert du mur' },
  { texte: 'ink', fond: 'papierSombre', minimum: 7, usage: 'texte sur le grain le plus sombre du papier' },
  { texte: 'ink', fond: 'trameSombre', minimum: 7, usage: 'texte sur la trame d’impression la plus sombre d’un lambeau' },
  { texte: 'ink', fond: 'lisereSombre', minimum: 7, usage: 'texte sur le liseré le plus sombre d’un lambeau' },
  { texte: 'ink', fond: 'poster', minimum: 4.5, usage: 'texte sur affiches et étiquettes' },
  { texte: 'ink', fond: 'chrome', minimum: 4.5, usage: 'libellés du lecteur' },
  { texte: 'ink', fond: 'chromeLight', minimum: 4.5, usage: 'boutons du lecteur' },
  { texte: 'redInk', fond: 'wall', minimum: 4.5, usage: 'texte rouge sur le mur (4,6 exigé, voir test)' },
  { texte: 'redInk', fond: 'poster', minimum: 4.5, usage: 'texte rouge sur affiche' },
  { texte: 'ink', fond: 'red', minimum: 4.5, usage: 'texte sur aplat rouge' },
  { texte: 'poster', fond: 'greenDeep', minimum: 4.5, usage: 'texte clair sur fond vert' },
  { texte: 'ink', fond: 'green', minimum: 3, usage: 'gros titres et éléments d’interface sur aplat vert' },
  { texte: 'poster', fond: 'ink', minimum: 4.5, usage: 'texte clair sur encre' },
  { texte: 'wall', fond: 'ink', minimum: 4.5, usage: 'texte papier sur encre' },
  { texte: 'lcdLit', fond: 'lcd', minimum: 4.5, usage: 'afficheur' },
  { texte: 'lcdDim', fond: 'lcd', minimum: 4.5, usage: 'libellés de l’afficheur' },
  { texte: 'lcdPeak', fond: 'lcd', minimum: 3, usage: 'segments de crête' },
]

/** Contraste minimal exigé pour `redInk` sur `wall`, plus strict que le seuil WCAG. */
export const MINIMUM_RED_INK_WALL = 4.6

/** Variables CSS `--g2g-<token>` à poser sur la racine de l'expérience. */
export function variablesCss(): CSSProperties {
  const style: Record<string, string> = {}
  for (const [nom, valeur] of Object.entries(couleurs)) style[`--g2g-${nom}`] = valeur
  return style as CSSProperties
}

export function luminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
}

/** Contraste WCAG entre deux couleurs hexadécimales. */
export function contraste(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
