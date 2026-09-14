import brut from '../questions-perso.json'
import { lireEchelle } from '../build-run'
import type { Acte, Mecanique, QuestionPerso } from '../types'

const MECANIQUES: readonly Mecanique[] = [
  'bascule',
  'curseur',
  'classement',
  'enchere',
  'tir-a-la-corde',
  'le-mot',
  'a-voix-haute',
]

/**
 * Lecture défensive du fichier perso : il est édité à la main, donc il peut
 * être vide, incomplet ou malformé. Aucun de ces cas ne doit casser la partie.
 */
function lire(): { auteur: string; pour: string; questions: QuestionPerso[] } {
  const source = brut as { auteur?: unknown; pour?: unknown; questions?: unknown }
  const liste = Array.isArray(source.questions) ? source.questions : []

  const questions = liste.flatMap((entree): QuestionPerso[] => {
    if (typeof entree !== 'object' || entree === null) return []
    const e = entree as Record<string, unknown>
    if (typeof e.texte !== 'string' || e.texte.trim() === '') return []
    const mecanique =
      typeof e.mecanique === 'string' && (MECANIQUES as readonly string[]).includes(e.mecanique)
        ? (e.mecanique as Mecanique)
        : undefined
    const acte = e.acte === 1 || e.acte === 2 || e.acte === 3 ? (e.acte as Acte) : undefined
    return [
      {
        texte: e.texte.trim(),
        ...(mecanique ? { mecanique } : {}),
        ...(Array.isArray(e.options)
          ? { options: e.options.filter((o): o is string => typeof o === 'string') }
          : {}),
        ...(acte ? { acte } : {}),
        ...(e.pari === true ? { pari: true } : {}),
        ...(lireEchelle(e.echelle) ? { echelle: lireEchelle(e.echelle) } : {}),
        ...(typeof e.mot === 'string' && e.mot.trim() !== '' ? { mot: e.mot.trim() } : {}),
      },
    ]
  })

  return {
    auteur: typeof source.auteur === 'string' ? source.auteur : '',
    pour: typeof source.pour === 'string' ? source.pour : '',
    questions,
  }
}

export const PERSO = lire()
