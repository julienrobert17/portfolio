import type { CSSProperties } from 'react'

/**
 * Désordre volontaire, déterministe : un aléa dérivé de l'identifiant de l'élément, jamais
 * Math.random() au rendu (hydratation). Brief §3.3 : rotations entre −4° et +4° pour les
 * cassettes, 2° au plus pour les flyers, divisées par deux sur mobile (CSS).
 */
function hachage(cle: string): number {
  let h = 2166136261
  for (let i = 0; i < cle.length; i++) {
    h ^= cle.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/** Valeur dans [-amplitude, amplitude], stable pour une clé donnée, arrondie au dixième. */
export function rotation(cle: string, amplitude: number): number {
  return Math.round((hachage(cle) * 2 - 1) * amplitude * 10) / 10
}

/** Variable CSS `--rot-base` à poser sur l'élément tourné ; le CSS en dérive `--rot`, divisée par deux sur mobile. */
export function styleRotation(cle: string, amplitude: number): CSSProperties {
  return { '--rot-base': `${rotation(cle, amplitude)}deg` } as CSSProperties
}

/** Variante stable dans [0, n−1] pour une clé donnée : sert au désordre discret (accroches, décalages). */
export function variante(cle: string, n: number): number {
  return Math.min(n - 1, Math.floor(hachage(cle) * n))
}
