/**
 * État partagé du hero entre trois arbres React distincts : la section (pin,
 * cote, titre), l'hôte du canvas (layout) et la scène. Les valeurs lues à
 * chaque frame sont des champs mutables ; seules `mode` et `canvasPret`
 * passent par React (useSyncExternalStore).
 */
export type ModeHero =
  /** Décision en cours : WebGL disponible, chargement de three lancé. */
  | 'attente'
  /** Canvas monté, coupe pilotée par le scroll. */
  | 'canvas'
  /** Repli : SVG statique avec coupe à mi-hauteur, cote fixe, pas de pin. */
  | 'statique'

export interface CadreHero {
  /** Centre du repère de la maquette SVG, en pixels, relatif au viewport pendant le pin. */
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
  /** Souris normalisée dans [-1, 1], (0, 0) au centre. */
  souris: { x: number; y: number }
  /** Le canvas est-il sur la page courante (accueil) ? */
  actif: boolean
}

export const hero: EtatHero = {
  mode: 'attente',
  canvasPret: false,
  progression: 0,
  finPin: Infinity,
  cadre: null,
  souris: { x: 0, y: 0 },
  actif: false,
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

export function lireMode(): ModeHero {
  return hero.mode
}

export function lireCanvasPret(): boolean {
  return hero.canvasPret
}
