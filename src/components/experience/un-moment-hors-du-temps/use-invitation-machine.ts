'use client'

import { useCallback, useEffect, useReducer, useRef } from 'react'

export const STEP_COUNT = 8
const STORAGE_KEY = 'hors-du-temps'
/** Verrou anti double-clic / spam, en ms. */
const ADVANCE_LOCK_MS = 420

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
export type Screen = StepIndex | 'refused'

export interface Answers {
  /** Indices des vignettes CAPTCHA cochées. */
  captcha: number[]
  robot: boolean
  /** null tant qu'elle n'a pas répondu à LA question. */
  yes: boolean | null
  /** Date au format YYYY-MM-DD. */
  dateISO: string | null
  /** Heure en minutes depuis minuit. */
  minutes: number | null
  activity: string | null
  activityOther: string
  pressure: number
  probability: number
  terms: boolean
}

export interface MachineState {
  screen: Screen
  /** 0 au premier passage, 1+ après « Recommencer » — pilote les variantes. */
  pass: number
  answers: Answers
  /** Sens de la dernière navigation, pour orienter la transition. */
  direction: 1 | -1
}

const initialAnswers: Answers = {
  captcha: [],
  robot: false,
  yes: null,
  dateISO: null,
  minutes: null,
  activity: null,
  activityOther: '',
  pressure: 40,
  probability: 99,
  terms: false,
}

const initialState: MachineState = {
  screen: 0,
  pass: 0,
  answers: initialAnswers,
  direction: 1,
}

type Action =
  | { type: 'goto'; screen: Screen; direction: 1 | -1 }
  | { type: 'answer'; patch: Partial<Answers> }
  | { type: 'restart' }
  | { type: 'hydrate'; state: MachineState }

function reducer(state: MachineState, action: Action): MachineState {
  switch (action.type) {
    case 'goto':
      if (action.screen === state.screen) return state
      return { ...state, screen: action.screen, direction: action.direction }
    case 'answer':
      return { ...state, answers: { ...state.answers, ...action.patch } }
    case 'restart':
      return {
        ...initialState,
        pass: state.pass + 1,
        answers: { ...initialAnswers },
      }
    case 'hydrate':
      return action.state
  }
}

// ── Sérialisation ────────────────────────────────────────────

function screenToHash(screen: Screen): string {
  return screen === 'refused' ? '#/fin' : `#/${screen}`
}

function hashToScreen(hash: string): Screen | null {
  if (hash === '#/fin') return 'refused'
  const match = /^#\/([0-7])$/.exec(hash)
  return match ? (Number(match[1]) as StepIndex) : null
}

function isScreen(value: unknown): value is Screen {
  return value === 'refused' || (typeof value === 'number' && value >= 0 && value < STEP_COUNT)
}

/**
 * Un lien tronqué dans un DM, ou bricolé à la main, ne doit jamais casser
 * l'écran final : on ne garde que les champs dont le type tient debout.
 */
function sanitizeAnswers(raw: Partial<Answers> | undefined): Answers {
  if (!raw) return initialAnswers
  const numberOr = (value: unknown, fallback: number | null) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return {
    captcha: Array.isArray(raw.captcha)
      ? raw.captcha.filter((item): item is number => typeof item === 'number')
      : [],
    robot: raw.robot === true,
    yes: typeof raw.yes === 'boolean' ? raw.yes : null,
    dateISO: typeof raw.dateISO === 'string' ? raw.dateISO : null,
    minutes: numberOr(raw.minutes, null),
    activity: typeof raw.activity === 'string' ? raw.activity : null,
    activityOther: typeof raw.activityOther === 'string' ? raw.activityOther : '',
    pressure: numberOr(raw.pressure, initialAnswers.pressure) ?? initialAnswers.pressure,
    probability: numberOr(raw.probability, initialAnswers.probability) ?? initialAnswers.probability,
    terms: raw.terms === true,
  }
}

function readStored(): MachineState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as Partial<MachineState>
    if (!isScreen(candidate.screen)) return null
    return {
      screen: candidate.screen,
      pass: typeof candidate.pass === 'number' ? candidate.pass : 0,
      answers: sanitizeAnswers(candidate.answers),
      direction: 1,
    }
  } catch {
    return null
  }
}

/**
 * L'état complet, encodé pour le lien partageable de l'écran final.
 * base64url : pas de +, /, = qui casseraient une URL collée dans un DM.
 */
export function encodeState(state: MachineState): string {
  const payload = JSON.stringify({ p: state.pass, a: state.answers })
  const bytes = new TextEncoder().encode(payload)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeState(encoded: string): Partial<MachineState> | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(padded + '==='.slice((padded.length + 3) % 4))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (typeof parsed !== 'object' || parsed === null) return null
    const candidate = parsed as { p?: number; a?: Partial<Answers> }
    return {
      pass: typeof candidate.p === 'number' ? candidate.p : 0,
      answers: sanitizeAnswers(candidate.a),
    }
  } catch {
    return null
  }
}

// ── Le hook ──────────────────────────────────────────────────

/**
 * Lu une seule fois, au premier rendu. Le composant est monté en `ssr: false`,
 * donc `window` existe toujours ici et il n'y a aucun risque de mismatch
 * d'hydratation — ce qui évite un effet de réhydratation et le flash d'écran
 * qui allait avec.
 * Priorité : lien partagé > hash courant > sessionStorage > départ à zéro.
 */
function createInitialState(): MachineState {
  if (typeof window === 'undefined') return initialState

  const hash = window.location.hash
  const shared = /^#\/s\/(.+)$/.exec(hash)
  if (shared) {
    const decoded = decodeState(shared[1])
    if (decoded) {
      return {
        screen: 7,
        pass: decoded.pass ?? 0,
        answers: decoded.answers ?? initialAnswers,
        direction: 1,
      }
    }
  }

  const base = readStored() ?? initialState
  const fromHash = hashToScreen(hash)
  return { ...base, screen: fromHash ?? base.screen, direction: 1 }
}

export function useInvitationMachine() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState)
  const lockRef = useRef(0)
  const firstScreenRef = useRef(state.screen)

  // L'URL doit refléter l'écran restauré, sans ajouter d'entrée d'historique.
  useEffect(() => {
    const screen = firstScreenRef.current
    window.history.replaceState({ screen }, '', screenToHash(screen))
  }, [])

  // Persistance : survit au refresh en plein milieu du parcours.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Navigation privée, quota plein : l'expérience marche sans.
    }
  }, [state])

  // Le bouton retour du navigateur.
  useEffect(() => {
    const onPop = () => {
      const screen = hashToScreen(window.location.hash)
      if (screen !== null) dispatch({ type: 'goto', screen, direction: -1 })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  /** Verrou partagé : neutralise double-clic et spam sur tous les boutons d'avance. */
  const claim = useCallback(() => {
    const now = Date.now()
    if (now - lockRef.current < ADVANCE_LOCK_MS) return false
    lockRef.current = now
    return true
  }, [])

  const go = useCallback(
    (screen: Screen, direction: 1 | -1 = 1) => {
      if (!claim()) return
      dispatch({ type: 'goto', screen, direction })
      window.history.pushState({ screen }, '', screenToHash(screen))
    },
    [claim],
  )

  const next = useCallback(() => {
    if (typeof state.screen !== 'number') return
    const target = Math.min(state.screen + 1, STEP_COUNT - 1) as StepIndex
    go(target, 1)
  }, [state.screen, go])

  const back = useCallback(() => {
    if (typeof state.screen !== 'number' || state.screen === 0) return
    const target = (state.screen - 1) as StepIndex
    go(target, -1)
  }, [state.screen, go])

  const setAnswers = useCallback((patch: Partial<Answers>) => {
    dispatch({ type: 'answer', patch })
  }, [])

  const restart = useCallback(() => {
    if (!claim()) return
    dispatch({ type: 'restart' })
    window.history.pushState({ screen: 0 }, '', screenToHash(0))
  }, [claim])

  return { ...state, go, next, back, setAnswers, restart }
}

export type InvitationMachine = ReturnType<typeof useInvitationMachine>
