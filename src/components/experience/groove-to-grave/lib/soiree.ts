import type { Soiree } from '../content/types'
import { LIEU_NON_RETROUVE } from './registre'

/**
 * Composition d'une soirée affichée (Phase 7.9, qui généralise la chronologie de 7.7 et 7.8).
 * **Toute soirée affichée passe par ici** — chronologie du label, page soirées, archive, bloc des
 * pages d'artistes, bande défilante — pour qu'il n'y ait qu'une règle, et une seule :
 *
 * - « Soirée » n'est ajouté que si le titre ne le porte pas déjà, et **sans titre, « Soirée » est
 *   le titre** : dans une chronologie qui mêle sorties et soirées, une ligne doit se dire ;
 * - **le lieu n'est jamais répété** s'il est déjà dans le titre, ou s'il est déjà écrit à côté
 *   (l'affiche typographique d'une soirée sans flyer l'imprime en grand) ;
 * - un champ absent ne laisse pas de virgule derrière lui, et un lieu inconnu se dit (registre).
 *
 * `g2g-verif` échoue si un lieu apparaît deux fois dans un même bloc rendu : les blocs portent
 * `data-soiree` et `data-lieu` pour que le contrôle n'ait rien à deviner.
 */

const sansAccent = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Forme comparable : sans accents, sans ponctuation, sans parenthèses, espaces normalisés. */
function comparable(t: string): string {
  return sansAccent(t)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export interface SoireeComposee {
  titre: string
  /** Vide quand le lieu est déjà dit ailleurs dans le même bloc. */
  lieu: string
  /** « annulée », « reportée », ou rien. */
  mention: string
}

/** Titre et lieu d'une soirée, une bonne fois. `lieuDejaDit` : le bloc l'écrit déjà à côté. */
export function composerSoiree(s: Soiree, lieuDejaDit = false): SoireeComposee {
  const titre = s.name?.trim()
  const lieu = s.venue.trim()
  const lieuComparable = comparable(lieu)
  const dansLeTitre = Boolean(titre) && lieuComparable.length > 0 && comparable(titre as string).includes(lieuComparable)
  return {
    titre: titre ? (/soir[ée]e/i.test(titre) ? titre : `Soirée ${titre}`) : 'Soirée',
    lieu: dansLeTitre || lieuDejaDit ? '' : lieu || LIEU_NON_RETROUVE,
    mention: s.status === 'annulee' ? 'annulée' : s.status === 'reportee' ? 'reportée' : '',
  }
}

/** La soirée en une ligne : titre, lieu, mention, sans virgule orpheline. */
export function ligneSoiree(s: Soiree, lieuDejaDit = false): string {
  const c = composerSoiree(s, lieuDejaDit)
  return [c.titre, c.lieu, c.mention].filter(Boolean).join(', ')
}
