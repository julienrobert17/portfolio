import type { Artiste, Soiree, Sortie } from '../content/types'
import { couleurAffiche, type Affiche } from './couleur-affiche'

/**
 * Ce que le gabarit artiste a besoin de savoir d'un artiste (Phase 7.7), rassemblé ici pour que
 * `tokens.test.ts` puisse passer les mêmes dix-neuf affiches que les pages servent réellement.
 */

/** Sorties d'un artiste : ses sorties solo d'abord, les plus récentes en tête, puis les compilations. */
export function sortiesDeLArtiste(toutes: Sortie[], slug: string, refs: string[]): Sortie[] {
  const liste = refs.map((r) => toutes.find((s) => s.ref === r)).filter((s): s is Sortie => s !== undefined)
  const rang = (s: Sortie) => (s.artistSlug === slug ? 0 : 1)
  return [...liste].sort((a, b) => rang(a) - rang(b) || b.releaseDate.localeCompare(a.releaseDate))
}

/**
 * Forme normalisée d'un nom : sans accents, sans ponctuation, espaces réduits, minuscules.
 * Sert uniquement à comparer un nom d'artiste à une entrée de line-up (Phase 7.8).
 */
export function normaliserNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Soirées du label où l'artiste figure au line-up. **Correspondance exacte sur le nom normalisé,
 * et rien d'autre** : aucune correspondance partielle, aucun rapprochement approximatif. Une
 * entrée comme « Emi Ömar b2b Gregs » ne correspond à personne, et c'est voulu — un faux
 * rapprochement serait une invention.
 */
export function soireesDeLArtiste(soirees: Soiree[], nom: string): Soiree[] {
  const cible = normaliserNom(nom)
  return soirees.filter((s) => s.lineup.some((l) => normaliserNom(l) === cible)).sort((a, b) => b.date.localeCompare(a.date))
}

/** Papier de l'affiche d'un artiste : la dominante de sa première pochette, repli compris. */
export function afficheDeLArtiste(artiste: Artiste, toutes: Sortie[]): Affiche {
  const sorties = sortiesDeLArtiste(toutes, artiste.slug, artiste.releases)
  return couleurAffiche(sorties.find((s) => s.couleurs)?.couleurs?.dominant)
}
