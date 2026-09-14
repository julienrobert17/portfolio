import type { Echelle, Question, Reponse, Valeur } from './types'

/**
 * Le tri de la fin de partie : « de quoi parler ce soir ». Ces distances ne
 * sont jamais affichées, ni sous forme de score ni de pourcentage — elles ne
 * servent qu'à ordonner les questions entre elles.
 *
 * Le fichier de questions perso est écrit à la main : toute entrée incohérente
 * doit ressortir en `null`, jamais en exception ni en NaN.
 */

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null
}

/** Ramène dans [0, 1], ou `null` si le calcul a dérapé (NaN, Infinity). */
function borner(x: number): number | null {
  if (!Number.isFinite(x)) return null
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x
}

function lireNombre(valeur: Valeur): number | null {
  return typeof valeur === 'number' && Number.isFinite(valeur) ? valeur : null
}

function lireTexte(valeur: Valeur): string | null {
  return typeof valeur === 'string' ? valeur : null
}

function lireListe(valeur: Valeur): readonly string[] | null {
  if (!Array.isArray(valeur)) return null
  const liste: readonly unknown[] = valeur
  return liste.every((element) => typeof element === 'string') ? (liste as readonly string[]) : null
}

function surCent(a: Valeur, b: Valeur): number | null {
  const va = lireNombre(a)
  const vb = lireNombre(b)
  if (va === null || vb === null) return null
  return borner(Math.abs(va - vb) / 100)
}

function surEchelle(echelle: Echelle | undefined, a: Valeur, b: Valeur): number | null {
  if (!estObjet(echelle)) return null
  const min = lireNombre(echelle.min)
  const max = lireNombre(echelle.max)
  if (min === null || max === null || max <= min) return null
  const va = lireNombre(a)
  const vb = lireNombre(b)
  if (va === null || vb === null) return null
  return borner(Math.abs(va - vb) / (max - min))
}

function surTexte(a: Valeur, b: Valeur): number | null {
  const va = lireTexte(a)
  const vb = lireTexte(b)
  if (va === null || vb === null) return null
  return va === vb ? 0 : 1
}

/**
 * Déplacement moyen des rangs, rapporté au déplacement moyen d'un renversement
 * complet : deux classements opposés valent 1, deux classements identiques 0.
 */
function surClassement(a: Valeur, b: Valeur): number | null {
  const va = lireListe(a)
  const vb = lireListe(b)
  if (va === null || vb === null) return null
  const n = va.length
  if (n < 2 || vb.length !== n) return null

  const rangs = new Map<string, number>()
  for (let i = 0; i < n; i += 1) rangs.set(va[i], i)
  // Un doublon rendrait les rangs ambigus : la question n'est pas mesurable.
  if (rangs.size !== n) return null

  let deplacement = 0
  const vus = new Set<string>()
  for (let i = 0; i < n; i += 1) {
    const rang = rangs.get(vb[i])
    if (rang === undefined || vus.has(vb[i])) return null
    vus.add(vb[i])
    deplacement += Math.abs(rang - i)
  }

  let maximum = 0
  for (let i = 0; i < n; i += 1) maximum += Math.abs(n - 1 - 2 * i)
  if (maximum <= 0) return null

  return borner(deplacement / maximum)
}

/** Jaccard sur les mots choisis : l'ordre ne compte pas, les doublons non plus. */
function surMots(a: Valeur, b: Valeur): number | null {
  const va = lireListe(a)
  const vb = lireListe(b)
  if (va === null || vb === null) return null

  const ensembleA = new Set(va)
  const ensembleB = new Set(vb)
  const union = new Set([...ensembleA, ...ensembleB])
  if (union.size === 0) return null

  let commun = 0
  for (const mot of ensembleA) if (ensembleB.has(mot)) commun += 1

  return borner(1 - commun / union.size)
}

function comparer(question: Question, a: Valeur, b: Valeur): number | null {
  switch (question.mecanique) {
    case 'curseur':
    case 'tir-a-la-corde':
      return surCent(a, b)
    case 'enchere':
      return surEchelle(question.echelle, a, b)
    case 'bascule':
      return surTexte(a, b)
    case 'classement':
      return surClassement(a, b)
    case 'le-mot':
      return surMots(a, b)
    // À voix haute ne laisse aucune trace : structurellement hors du classement.
    case 'a-voix-haute':
      return null
    default:
      return null
  }
}

/**
 * Distance normalisée dans [0, 1] entre les deux réponses.
 * `null` quand la question n'est pas mesurable.
 */
export function distance(question: Question, a: Reponse, b: Reponse): number | null {
  if (!estObjet(question) || !estObjet(a) || !estObjet(b)) return null
  if (a.passe === true || b.passe === true) return null
  return comparer(question, a.valeur ?? null, b.valeur ?? null)
}

/**
 * Écart de pari normalisé dans [0, 1] : ce que `devineur` avait deviné,
 * comparé à ce que `cible` a réellement répondu. `null` si non mesurable.
 */
export function ecartPari(question: Question, devineur: Reponse, cible: Reponse): number | null {
  if (!estObjet(question) || !estObjet(devineur) || !estObjet(cible)) return null
  if (question.pari !== true) return null
  if (devineur.passe === true || cible.passe === true) return null
  if (devineur.pari === undefined) return null
  return comparer(question, devineur.pari, cible.valeur ?? null)
}
