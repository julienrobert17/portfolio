import type { Artiste, Soiree, Sortie } from '../content/types'
import { MINIMUM_AFFICHE_PETIT_TEXTE, couleurAffiche, type Affiche } from './couleur-affiche'

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

/** Dominante de l'artiste : celle de sa première pochette, dans l'ordre d'affichage de ses sorties. */
export function dominanteDeLArtiste(artiste: Artiste, toutes: Sortie[]): string | undefined {
  return sortiesDeLArtiste(toutes, artiste.slug, artiste.releases).find((s) => s.couleurs)?.couleurs?.dominant
}

/**
 * Les deux tons d'un artiste, tirés de la **même** dominante (Phase 7.9) : l'affiche de sa page,
 * qui ne porte qu'un titre énorme, et la tuile du mur des artistes, qui porte un petit texte et
 * demande donc le seuil du texte courant. Une seule source, pour qu'un clic ne change pas de teinte.
 */
export function tonsDeLArtiste(artiste: Artiste, toutes: Sortie[]): { affiche: Affiche; tuile: Affiche } {
  const dominante = dominanteDeLArtiste(artiste, toutes)
  return { affiche: couleurAffiche(dominante), tuile: couleurAffiche(dominante, MINIMUM_AFFICHE_PETIT_TEXTE) }
}
