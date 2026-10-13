import type { Artiste, Sortie } from '../content/types'
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

/** Papier de l'affiche d'un artiste : la dominante de sa première pochette, repli compris. */
export function afficheDeLArtiste(artiste: Artiste, toutes: Sortie[]): Affiche {
  const sorties = sortiesDeLArtiste(toutes, artiste.slug, artiste.releases)
  return couleurAffiche(sorties.find((s) => s.couleurs)?.couleurs?.dominant)
}
