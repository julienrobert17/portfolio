/**
 * État partagé du hero entre trois arbres React distincts : la section (pin,
 * cote, titre), l'hôte du canvas (layout) et la scène. Les valeurs lues à
 * chaque frame sont des champs mutables ; seuls `mode` et `canvasPret`
 * passent par React (useSyncExternalStore).
 */
export type ModeHero =
  /** Rien de décidé : premier rendu, avant tout effet. */
  | 'indecis'
  /** WebGL disponible, chargement de three lancé après le premier rendu. */
  | 'attente'
  /** Canvas monté et première frame rendue : coupe pilotée par le scroll. */
  | 'canvas'
  /** Repli : SVG statique avec coupe à mi-hauteur, cote fixe, pas de pin. */
  | 'statique'

export interface CadreHero {
  /** Centre du repère de la maquette SVG en pixels, relatif au viewport pendant le pin. */
  cx: number
  cy: number
  largeur: number
}

interface EtatHero {
  mode: ModeHero
  canvasPret: boolean
  /** 0 : rien de coupé ; 1 : coupe au sol. Lissée par le scrub. */
  progression: number
  /** Position de scroll où le pin se termine ; Infinity tant qu'il n'existe pas. */
  finPin: number
  cadre: CadreHero | null
  /** Souris normalisée dans [-1, 1], (0, 0) au centre de la fenêtre. */
  souris: { x: number; y: number }
  /** Le canvas est-il sur la page courante (accueil) ? */
  actif: boolean
  /** Quelque chose a changé : la prochaine frame doit être rendue. */
  sale: boolean
}

export const hero: EtatHero = {
  mode: 'indecis',
  canvasPret: false,
  progression: 0,
  finPin: Infinity,
  cadre: null,
  souris: { x: 0, y: 0 },
  actif: false,
  sale: true,
}

// En développement seulement : piloter la coupe depuis la console (captures, débogage).
declare global {
  interface Window {
    __laCoupeHero?: EtatHero
  }
}
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__laCoupeHero = hero
}

type Ecouteur = () => void
const ecouteurs = new Set<Ecouteur>()

function notifier() {
  for (const fn of ecouteurs) fn()
}

export function abonnerHero(fn: Ecouteur): () => void {
  ecouteurs.add(fn)
  return () => {
    ecouteurs.delete(fn)
  }
}

export function setModeHero(mode: ModeHero): void {
  if (hero.mode === mode) return
  hero.mode = mode
  notifier()
}

export function setCanvasPret(pret: boolean): void {
  if (hero.canvasPret === pret) return
  hero.canvasPret = pret
  notifier()
}

export const lireMode = (): ModeHero => hero.mode
export const lireCanvasPret = (): boolean => hero.canvasPret
export const lireModeServeur = (): ModeHero => 'indecis'
export const lireFaux = (): boolean => false

function webglDisponible(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Tranche une fois pour toutes, au premier composant monté qui le demande :
 * repli statique si mouvement réduit ou sans WebGL, sinon on attend three.
 */
export function deciderModeHero(): ModeHero {
  if (hero.mode === 'indecis') {
    // Lu directement : le hook useReducedMotion rend d'abord la valeur serveur
    // (faux) à l'hydratation, et la décision doit être juste du premier coup.
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setModeHero(reduit || !webglDisponible() ? 'statique' : 'attente')
  }
  return hero.mode
}
