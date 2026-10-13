import type { Soiree } from '../content/types'
import { LIEU_NON_RETROUVE } from './registre'

/**
 * Ligne de chronologie d'une soirée (Phase 7.7). Elle était collée sans regarder : « Soirée
 * Première soirée », « à la Panic Room, Panic Room », « Soirée, 42 Marches ». Elle est maintenant
 * composée à partir des champs : le mot « Soirée » n'est ajouté que si le titre existe et ne le
 * porte pas déjà, le lieu n'est rappelé que si le titre ne le contient pas, et il ne reste jamais
 * de virgule en attente d'un champ absent.
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

export function ligneChronologie(s: Soiree): string {
  const titre = s.name?.trim()
  const lieu = s.venue.trim()
  const titreComparable = titre ? comparable(titre) : ''
  const lieuComparable = comparable(lieu)
  const lieuDejaDit = Boolean(titreComparable) && lieuComparable.length > 0 && titreComparable.includes(lieuComparable)
  const prefixe = titre && !/soir[ée]e/i.test(titre) ? 'Soirée ' : ''
  // Sans titre ni lieu, la ligne ne peut pas être vide : elle dit l'absence (registre public).
  const morceaux = [titre ? `${prefixe}${titre}` : lieu || LIEU_NON_RETROUVE]
  if (titre && lieu && !lieuDejaDit) morceaux.push(lieu)
  if (s.status === 'annulee') morceaux.push('annulée')
  if (s.status === 'reportee') morceaux.push('reportée')
  return morceaux.join(', ')
}
