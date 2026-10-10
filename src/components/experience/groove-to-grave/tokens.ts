import type { CSSProperties } from 'react'

/**
 * Tokens de « Groove To Grave » : palette relevée sur les pochettes et les flyers du label
 * (passe d'identité du 10 octobre 2026), exposée en variables CSS `--g2g-<token>` par
 * `variablesCss()`. Les paires texte/fond autorisées sont listées dans `PAIRES` et vérifiées
 * par tokens.test.ts (`npm run test:g2g-tokens`). Brief §3.1.
 */
export const couleurs = {
  /** Fond du mur, papier d'affichage. */
  wall: '#efe6d2',
  /** Affiches, étiquettes de cassette, texte clair sur fonds sombres. */
  poster: '#faf4e6',
  /** Texte, traits, contours. */
  ink: '#111111',
  /** Aplats et éléments graphiques, relevé sur GTGRVA01. Jamais en texte sur fond clair. */
  red: '#f14442',
  /** Texte rouge sur fond clair. */
  redInk: '#c21e19',
  /** Aplats et éléments graphiques, relevé sur GTGRVA02. Jamais en texte sur fond clair. */
  green: '#268459',
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
  /** 4,5 pour le texte courant ; 3 pour le texte de 24 px et plus et les éléments d'interface. */
  minimum: 4.5 | 3
  usage: string
}

/** Chaque paire texte/fond utilisée par le site. Toute nouvelle paire s'ajoute ici avant d'être utilisée. */
export const PAIRES: Paire[] = [
  { texte: 'ink', fond: 'wall', minimum: 4.5, usage: 'texte courant sur le mur' },
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
