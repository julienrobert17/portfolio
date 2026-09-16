import { projets } from './projets'
import type { Categorie, Projet } from './types'

export { site, imagesAtelier } from './site'
export { atelier } from './atelier'
export { projets }
export type * from './types'

export function getProjet(slug: string): Projet | undefined {
  return projets.find((p) => p.slug === slug)
}

/** Projet qui suit dans l'index, en boucle. */
export function projetSuivant(slug: string): Projet {
  const i = projets.findIndex((p) => p.slug === slug)
  return projets[(i + 1) % projets.length]
}

export function numeroProjet(slug: string): string {
  const i = projets.findIndex((p) => p.slug === slug)
  return String(i + 1).padStart(2, '0')
}

export const categories: Categorie[] = Array.from(new Set(projets.map((p) => p.categorie)))
