/**
 * Garde d'intention sur les butées d'un panneau à défilement interne.
 *
 * Un wheel (ou un delta de swipe) dans le sens d'une butée ne fait basculer
 * de panneau que s'il traduit un geste volontaire, pas l'inertie du geste
 * qui a amené le conteneur en butée. Fonctions pures : l'état est une valeur,
 * le contrôleur conserve la dernière version retournée.
 */

/** Après l'arrivée en butée, les deltas dans son sens sont ignorés pendant ce délai (inertie). */
export const EDGE_GUARD_MS = 400
/** Cumul de deltas, dans le sens de la butée, nécessaire pour basculer. */
export const EDGE_CUMUL_PX = 80
/** Le cumul repart de zéro après ce silence. */
export const EDGE_RESET_MS = 500
/** En dessous de cette amplitude, un delta ne compte pas (résidu d'inertie). */
export const EDGE_MIN_DELTA = 4

/** 1 = vers le bas (butée basse), -1 = vers le haut (butée haute). */
export type EdgeDirection = 1 | -1

export interface EdgeSnapshot {
  atTop: boolean
  atBottom: boolean
  /** Le contenu dépasse le conteneur. Sinon le délai d'inertie est nul : un geste suffit. */
  overflows: boolean
}

export interface EdgeGuardState {
  /** Instant d'arrivée en butée haute / basse, null si le conteneur n'y est pas. */
  topSince: number | null
  bottomSince: number | null
  /** Cumul des deltas dans le sens courant, et instant du dernier delta compté. */
  cumul: number
  direction: EdgeDirection | 0
  lastAt: number
}

export const initialEdgeGuard: EdgeGuardState = {
  topSince: null,
  bottomSince: null,
  cumul: 0,
  direction: 0,
  lastAt: 0,
}

/** Enregistre les arrivées et départs de butée d'après l'état du conteneur (scroll, affichage). */
export function noteEdges(state: EdgeGuardState, snap: EdgeSnapshot, now: number): EdgeGuardState {
  return {
    ...state,
    topSince: snap.atTop ? (state.topSince ?? now) : null,
    bottomSince: snap.atBottom ? (state.bottomSince ?? now) : null,
  }
}

/** Décide, pour un delta (wheel ou swipe), s'il faut basculer de panneau dans son sens. */
export function registerDelta(
  state: EdgeGuardState,
  snap: EdgeSnapshot,
  delta: number,
  now: number,
): { state: EdgeGuardState; flip: boolean } {
  const noted = noteEdges(state, snap, now)
  if (Math.abs(delta) < EDGE_MIN_DELTA) return { state: noted, flip: false }

  const direction: EdgeDirection = delta > 0 ? 1 : -1
  const since = direction === 1 ? noted.bottomSince : noted.topSince
  // Pas en butée dans ce sens : le conteneur défile, rien à cumuler
  if (since === null) return { state: { ...noted, cumul: 0, direction, lastAt: now }, flip: false }

  // Inertie du geste d'arrivée
  const delay = snap.overflows ? EDGE_GUARD_MS : 0
  if (now - since < delay) return { state: noted, flip: false }

  const sameRun = noted.direction === direction && now - noted.lastAt <= EDGE_RESET_MS
  const cumul = (sameRun ? noted.cumul : 0) + Math.abs(delta)
  if (cumul >= EDGE_CUMUL_PX) return { state: { ...noted, cumul: 0, direction, lastAt: now }, flip: true }
  return { state: { ...noted, cumul, direction, lastAt: now }, flip: false }
}
