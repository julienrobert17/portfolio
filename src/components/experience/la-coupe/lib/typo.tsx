import type { ReactNode } from 'react'

/**
 * Typographie française appliquée au contenu : espace fine insécable (U+202F)
 * avant ? ! ; : et le guillemet fermant, après le guillemet ouvrant.
 *
 * Les règles sont écrites pour ne jamais toucher une chaîne technique : le
 * deux-points n'est repris que s'il est suivi d'une espace ou de la fin, donc
 * ni `mailto:`, ni `https://`, ni « 12:30 » ne bougent ; les autres signes
 * n'apparaissent pas dans une URL ni dans un tracé SVG. Idempotent : une
 * chaîne déjà composée traverse la fonction sans changer.
 */
const FINE = ' '

export function typo(texte: string): string {
  return texte
    .replace(/«[\s  ]*/g, `«${FINE}`)
    .replace(/[\s  ]*»/g, `${FINE}»`)
    .replace(/([^\s  ])[\s ]*([?!;])/g, `$1${FINE}$2`)
    .replace(/([^\s  ])[\s ]*:([\s ]|$)/g, `$1${FINE}:$2`)
}

/**
 * Applique `typo` à toutes les chaînes d'une valeur de contenu, en profondeur.
 * Les modules de `content/` passent leurs exports ici : la composition suit le
 * texte partout où il est rendu, sans avoir à y penser à chaque appel.
 */
export function typographier<T>(valeur: T): T {
  if (typeof valeur === 'string') return typo(valeur) as T
  if (Array.isArray(valeur)) return valeur.map(typographier) as T
  if (valeur && typeof valeur === 'object' && Object.getPrototypeOf(valeur) === Object.prototype) {
    return Object.fromEntries(Object.entries(valeur).map(([cle, v]) => [cle, typographier(v)])) as T
  }
  return valeur
}

/** Mot composé d'un trait d'union : « Saint-Ouen », « Hauts-Champs », « Jean-Baptiste ». */
const COMPOSE = /(\S+-\S+)/g

/**
 * Le texte, composé, avec ses mots à trait d'union rendus insécables. Un nom
 * propre ne se coupe pas sur son trait : « Halle Saint-/Ouen » est une faute.
 * Le trait d'union insécable U+2011 ferait le travail, mais la fonte peut ne
 * pas l'avoir ; c'est donc un `.lc-colle` (white-space: nowrap) qui l'enveloppe.
 */
export function insecable(texte: string): ReactNode {
  const morceaux = typo(texte).split(COMPOSE)
  if (morceaux.length === 1) return morceaux[0]
  return morceaux.map((m, i) =>
    i % 2 === 1 ? (
      <span key={i} className="lc-colle">
        {m}
      </span>
    ) : (
      m
    ),
  )
}
