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
