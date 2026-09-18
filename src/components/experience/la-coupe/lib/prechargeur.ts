import { site } from '../content/site'
import { abonnerHero, lireCanvasPret, lireMode } from './hero-store'

/** Coupe-circuit : passer à `false` pour retirer le préchargeur (Phase 5). */
export const PRELOADER_ACTIF = true

/** Clé sessionStorage : le préchargeur ne se montre qu'une fois par session. */
export const CLE_SESSION_PRECHARGEUR = 'lc-prechargeur'

/** Durée minimale d'affichage avant que le calque ne se lève. */
export const DUREE_MIN = 900
/** Au-delà, on sort quoi qu'il arrive (canvas pas prêt, police lente…). */
export const DUREE_MAX = 2500
/** Course visuelle de 0 à 90 % tant que rien n'est prêt. */
export const DUREE_AVANCE = 1200
/** Achèvement 90 → 100 % une fois le réel prêt. */
export const DUREE_FIN = 300
/** Levée du calque par clip-path (même valeur que dans le CSS Module). */
export const DUREE_SORTIE = 900

export type PhasePrechargeur =
  /** Rendu serveur et hydratation : rien n'est affiché. */
  | 'indecis'
  /** Calque posé, progression en cours. */
  | 'affiche'
  /** Le calque se lève, le hero se révèle. */
  | 'sortie'
  /** Démonté, ou jamais affiché. */
  | 'fini'

/*
 * Store minimal (même patron que hero-store) : la phase vit hors de React
 * pour que la décision d'affichage, prise dans un effet, ne passe pas par un
 * setState synchrone dans un effet (règle React Compiler).
 */
let phase: PhasePrechargeur = 'indecis'
const ecouteurs = new Set<() => void>()

export function abonnerPrechargeur(fn: () => void): () => void {
  ecouteurs.add(fn)
  return () => {
    ecouteurs.delete(fn)
  }
}

export const lirePhasePrechargeur = (): PhasePrechargeur => phase
export const lirePhasePrechargeurServeur = (): PhasePrechargeur => 'indecis'

export function setPhasePrechargeur(suivante: PhasePrechargeur): void {
  if (phase === suivante) return
  phase = suivante
  for (const fn of ecouteurs) fn()
}

function sessionMarquee(): boolean {
  try {
    return window.sessionStorage.getItem(CLE_SESSION_PRECHARGEUR) === '1'
  } catch {
    // Stockage indisponible (navigation privée stricte) : on considère la session marquée.
    return true
  }
}

function marquerSession(): void {
  try {
    window.sessionStorage.setItem(CLE_SESSION_PRECHARGEUR, '1')
  } catch {
    // Sans stockage, le préchargeur se montrerait à chaque chargement ; sessionMarquee() l'évite.
  }
}

/**
 * Tranche une fois par chargement de page (idempotent, donc sûr en Strict
 * Mode) : le préchargeur ne s'affiche qu'à l'arrivée sur l'accueil, une fois
 * par session, sans mouvement réduit. Une navigation client ultérieure vers
 * l'accueil ne le rejoue pas. La session est marquée dès la décision.
 */
export function deciderPrechargeur(pathname: string): PhasePrechargeur {
  if (phase !== 'indecis') return phase
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const afficher = PRELOADER_ACTIF && pathname === site.base && !reduit && !sessionMarquee()
  if (afficher) marquerSession()
  setPhasePrechargeur(afficher ? 'affiche' : 'fini')
  return phase
}

/** Le hero est prêt : première frame du canvas rendue, ou repli statique décidé. */
const heroPret = (): boolean => lireCanvasPret() || lireMode() === 'statique'

/**
 * Mesure du réel : polices chargées, puis hero prêt. Appelle `onPret` une
 * seule fois ; retourne la fonction d'annulation.
 */
export function attendreReel(onPret: () => void): () => void {
  let annule = false
  let off: (() => void) | null = null
  document.fonts.ready.then(() => {
    if (annule) return
    if (heroPret()) {
      onPret()
      return
    }
    off = abonnerHero(() => {
      if (!heroPret()) return
      off?.()
      off = null
      onPret()
    })
  })
  return () => {
    annule = true
    off?.()
    off = null
  }
}
