/**
 * Le registre public (Phase 7.7). Le site publie un registre, pas un chantier : une information
 * inconnue se tait, ou se dit « non retrouvé ». Jamais « à vérifier », « à confirmer », « TODO »,
 * ni un point d'interrogation seul — ni dans le contenu écrit par le label, ni en dur dans le code.
 *
 * Source unique : le Studio importe la même expression pour refuser ces formules à la saisie
 * (`studio/schemas/communs.ts`), et `g2g-verif` la repasse sur le texte rendu de chaque page.
 * Le fichier ne dépend de rien, pour rester importable des deux côtés.
 */
export const NOTES_DE_CHANTIER =
  /(?:^|[^\p{L}\p{N}])[àa]\s+(?:v[ée]rifier|confirmer|compl[ée]ter|pr[ée]ciser)\b|(?:^|[^\p{L}\p{N}])(?:to-?do|tbd|fixme|wip)(?:$|[^\p{L}\p{N}])|^\s*[?¿]+\s*$|^\s*(?:xxx+|\.{3})\s*$/iu

/** Vrai si la valeur est une note de chantier, qui n'a donc rien à faire dans le registre. */
export function estNoteDeChantier(valeur: unknown): boolean {
  return typeof valeur === 'string' && NOTES_DE_CHANTIER.test(valeur)
}

/** Ce que le site écrit quand le lieu d'une soirée n'a pas été retrouvé (voir `lib/soiree.ts`). */
export const LIEU_NON_RETROUVE = 'Lieu non retrouvé'
