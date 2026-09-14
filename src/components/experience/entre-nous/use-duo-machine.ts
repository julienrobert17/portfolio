'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { oublierGraine } from './graine'
import type { Cote, Installation, Reponse, RunPlan } from './types'

const STORAGE_KEY = 'entre-nous'
/** Verrou anti double-tap sur les avances. */
const LOCK_MS = 380

export type Phase =
  | 'calibration'
  | 'reprise'
  | 'jeu'
  | 'interlude'
  | 'couture'
  | 'ordre-du-jour'
  | 'derniere'

export interface DuoState {
  phase: Phase
  installation: Installation
  /** Quel prénom occupe quelle moitié. */
  noms: Record<Cote, string>
  /** Index dans run.questions. */
  index: number
  /**
   * Les réponses validées, par id de question puis par côté.
   * Une réponse n'entre ici QU'À la validation : tant qu'un côté n'a pas
   * validé, sa réponse n'existe nulle part dans l'état, donc rien ne peut
   * fuiter vers l'autre moitié, ni dans le DOM.
   */
  reponses: Record<string, Partial<Record<Cote, Reponse>>>
}

function etatInitial(noms: Record<Cote, string>): DuoState {
  return {
    phase: 'calibration',
    installation: 'face-a-face',
    noms,
    index: 0,
    reponses: {},
  }
}

type Action =
  | { type: 'calibrer'; installation: Installation; noms: Record<Cote, string> }
  | { type: 'repondre'; qid: string; cote: Cote; reponse: Reponse }
  | { type: 'phase'; phase: Phase }
  | { type: 'index'; index: number }
  | { type: 'recommencer'; noms: Record<Cote, string> }

function reducer(state: DuoState, action: Action): DuoState {
  switch (action.type) {
    case 'calibrer':
      return { ...state, installation: action.installation, noms: action.noms, phase: 'jeu' }
    case 'repondre':
      return {
        ...state,
        reponses: {
          ...state.reponses,
          [action.qid]: { ...state.reponses[action.qid], [action.cote]: action.reponse },
        },
      }
    case 'phase':
      return { ...state, phase: action.phase }
    case 'index':
      return { ...state, index: action.index }
    case 'recommencer':
      return etatInitial(action.noms)
  }
}

function lireStockage(noms: Record<Cote, string>): DuoState | null {
  try {
    const brut = sessionStorage.getItem(STORAGE_KEY)
    if (!brut) return null
    const parse: unknown = JSON.parse(brut)
    if (typeof parse !== 'object' || parse === null) return null
    const c = parse as Partial<DuoState>
    if (typeof c.index !== 'number') return null
    return {
      phase: 'reprise',
      installation: c.installation === 'cote-a-cote' ? 'cote-a-cote' : 'face-a-face',
      noms: c.noms ?? noms,
      index: c.index,
      reponses: typeof c.reponses === 'object' && c.reponses !== null ? c.reponses : {},
    }
  } catch {
    return null
  }
}

/**
 * Perdre vingt minutes de réponses serait inacceptable : l'état complet est
 * relu au démarrage. S'il y a déjà des réponses, on propose explicitement de
 * reprendre plutôt que de replonger sans prévenir.
 */
function creerEtatInitial(noms: Record<Cote, string>): DuoState {
  if (typeof window === 'undefined') return etatInitial(noms)
  const repris = lireStockage(noms)
  if (repris && (repris.index > 0 || Object.keys(repris.reponses).length > 0)) return repris
  return etatInitial(noms)
}

export function useDuoMachine(run: RunPlan, noms: Record<Cote, string>) {
  const [state, dispatch] = useReducer(reducer, noms, creerEtatInitial)
  const verrou = useRef(0)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Navigation privée ou quota plein : l'expérience marche sans.
    }
  }, [state])

  const prendre = useCallback(() => {
    const now = Date.now()
    if (now - verrou.current < LOCK_MS) return false
    verrou.current = now
    return true
  }, [])

  const question = run.questions[state.index] ?? null
  const reponsesCourantes = question ? (state.reponses[question.id] ?? {}) : {}
  /** Les deux ont validé : et seulement alors on révèle. */
  const revele = Boolean(reponsesCourantes.a && reponsesCourantes.b)

  const calibrer = useCallback(
    (installation: Installation, nomsChoisis: Record<Cote, string>) =>
      dispatch({ type: 'calibrer', installation, noms: nomsChoisis }),
    [],
  )

  const repondre = useCallback(
    (cote: Cote, reponse: Reponse) => {
      if (!question) return
      dispatch({ type: 'repondre', qid: question.id, cote, reponse })
    },
    [question],
  )

  const passer = useCallback(
    (cote: Cote) => {
      if (!question) return
      dispatch({ type: 'repondre', qid: question.id, cote, reponse: { valeur: null, passe: true } })
    },
    [question],
  )

  const suivant = useCallback(() => {
    if (!prendre()) return
    const prochain = state.index + 1
    if (prochain >= run.questions.length) {
      dispatch({ type: 'phase', phase: 'couture' })
      return
    }
    const acteAvant = run.questions[state.index]?.acte
    const acteApres = run.questions[prochain]?.acte
    dispatch({ type: 'index', index: prochain })
    // Changement d'acte : on intercale une respiration.
    if (acteApres !== undefined && acteAvant !== undefined && acteApres !== acteAvant) {
      dispatch({ type: 'phase', phase: 'interlude' })
    }
  }, [prendre, state.index, run.questions])

  const allerA = useCallback((phase: Phase) => dispatch({ type: 'phase', phase }), [])

  const recommencer = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // sans effet
    }
    // Nouvelle partie, nouveau tirage.
    oublierGraine()
    dispatch({ type: 'recommencer', noms })
  }, [noms])

  return {
    ...state,
    question,
    reponsesCourantes,
    revele,
    total: run.questions.length,
    calibrer,
    repondre,
    passer,
    suivant,
    allerA,
    recommencer,
  }
}

export type DuoMachine = ReturnType<typeof useDuoMachine>
