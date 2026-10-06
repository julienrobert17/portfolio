/**
 * Garde d'intention sur les butées d'un panneau à défilement interne.
 *
 * Le geste en cours au moment de l'arrivée en butée est entièrement ignoré,
 * quelle que soit sa durée (inertie du trackpad comprise). Seul un nouveau
 * geste, commencé alors qu'on est déjà en butée, peut faire basculer, après
 * 80 px cumulés dans le sens de la butée. Fonctions pures : l'état est une
 * valeur, le contrôleur conserve la dernière version retournée.
 */

/** Cumul de deltas, dans le sens de la butée, nécessaire pour basculer. */
export const EDGE_CUMUL_PX = 80
/** Le cumul repart de zéro après ce silence. */
export const EDGE_RESET_MS = 500
/** Nouveau geste (molette) : aucun événement depuis ce délai. */
export const NEW_GESTURE_SILENCE_MS = 120
/** Nouveau geste (molette) : ré-accélération d'au moins ce facteur sur une queue d'inertie décroissante… */
export const NEW_GESTURE_FACTOR = 2
/** … et d'au moins cette amplitude. */
export const NEW_GESTURE_MIN_PX = 8

/** 1 = vers le bas (butée basse), -1 = vers le haut (butée haute). */
export type EdgeDirection = 1 | -1
export type DeltaSource = 'wheel' | 'touch'

export interface EdgeSnapshot {
  atTop: boolean
  atBottom: boolean
}

export interface EdgeGuardState {
  /** Le conteneur est en butée haute / basse (suivi des arrivées et départs). */
  atTop: boolean
  atBottom: boolean
  /** Verrou de chaque butée : posé à l'arrivée, levé par un nouveau geste. */
  topLocked: boolean
  bottomLocked: boolean
  /** Suivi des deltas pour la détection de nouveau geste à la molette. */
  lastAt: number
  lastAbs: number
  decreasing: boolean
  /** Cumul des deltas dans le sens courant depuis la levée du verrou. */
  cumul: number
  direction: EdgeDirection | 0
}

export const initialEdgeGuard: EdgeGuardState = {
  atTop: false,
  atBottom: false,
  topLocked: false,
  bottomLocked: false,
  lastAt: -Infinity,
  lastAbs: 0,
  decreasing: false,
  cumul: 0,
  direction: 0,
}

/**
 * Suit les arrivées et départs de butée d'après l'état du conteneur (scroll,
 * affichage). Toute arrivée pose le verrou de la butée ; la quitter le réarme
 * pour la prochaine arrivée.
 */
export function noteEdges(state: EdgeGuardState, snap: EdgeSnapshot): EdgeGuardState {
  const arrivedTop = snap.atTop && !state.atTop
  const arrivedBottom = snap.atBottom && !state.atBottom
  return {
    ...state,
    atTop: snap.atTop,
    atBottom: snap.atBottom,
    topLocked: snap.atTop ? (state.topLocked || arrivedTop) : false,
    bottomLocked: snap.atBottom ? (state.bottomLocked || arrivedBottom) : false,
    cumul: arrivedTop || arrivedBottom ? 0 : state.cumul,
  }
}

/** Un nouveau geste commence (touchstart) : les verrous des butées sautent. */
export function beginGesture(state: EdgeGuardState): EdgeGuardState {
  return { ...state, topLocked: false, bottomLocked: false, cumul: 0, direction: 0 }
}

/**
 * Suivi d'un delta sans décision (panneau sans défilement, le hero) : le
 * geste en cours reste connu quand le panneau suivant s'affiche.
 */
export function trackDelta(state: EdgeGuardState, delta: number, now: number): EdgeGuardState {
  const abs = Math.abs(delta)
  return { ...state, lastAt: now, lastAbs: abs, decreasing: abs < state.lastAbs }
}

/**
 * Affichage d'un panneau : butées, verrous et cumul repartent de zéro pour ce
 * conteneur, le suivi du geste est conservé. S'il est déjà en butée, le verrou
 * est posé à l'affichage.
 */
export function enterPanel(state: EdgeGuardState, snap: EdgeSnapshot): EdgeGuardState {
  return noteEdges(
    { ...state, atTop: false, atBottom: false, topLocked: false, bottomLocked: false, cumul: 0, direction: 0 },
    snap,
  )
}

/** Détection d'un nouveau geste à la molette : silence, ou ré-accélération sur une queue d'inertie. */
function isNewWheelGesture(state: EdgeGuardState, abs: number, now: number): boolean {
  if (now - state.lastAt >= NEW_GESTURE_SILENCE_MS) return true
  return state.decreasing && abs > NEW_GESTURE_FACTOR * state.lastAbs && abs > NEW_GESTURE_MIN_PX
}

/** Décide, pour un delta (molette ou swipe, positif vers le bas), s'il faut basculer dans son sens. */
export function registerDelta(
  state: EdgeGuardState,
  snap: EdgeSnapshot,
  delta: number,
  now: number,
  source: DeltaSource = 'wheel',
): { state: EdgeGuardState; flip: boolean } {
  let next = noteEdges(state, snap)
  const abs = Math.abs(delta)
  const direction: EdgeDirection = delta > 0 ? 1 : -1

  if (source === 'wheel' && isNewWheelGesture(next, abs, now)) next = beginGesture(next)

  const silence = now - next.lastAt
  next = trackDelta(next, delta, now)

  const atEdge = direction === 1 ? next.atBottom : next.atTop
  const locked = direction === 1 ? next.bottomLocked : next.topLocked
  // Pas en butée dans ce sens : le conteneur défile, rien à cumuler
  if (!atEdge) return { state: { ...next, cumul: 0, direction }, flip: false }
  // Geste d'arrivée en butée : ignoré jusqu'à un nouveau geste
  if (locked) return { state: next, flip: false }

  const sameRun = next.direction === direction && silence <= EDGE_RESET_MS
  const cumul = (sameRun ? next.cumul : 0) + abs
  if (cumul >= EDGE_CUMUL_PX) return { state: { ...next, cumul: 0, direction }, flip: true }
  return { state: { ...next, cumul, direction }, flip: false }
}
