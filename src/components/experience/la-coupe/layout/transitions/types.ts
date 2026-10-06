import type { ComponentType, ReactNode } from 'react'

/**
 * Contrat d'une implémentation de transition de page. Deux candidates :
 * l'API View Transitions (via React) et une couche maison GSAP Flip.
 * `PageTransition` ne connaît que ce contrat.
 */
export interface TransitionImplementation {
  nom: 'view-transitions' | 'flip'
  /** Enveloppe le contenu de page ; `pathname` sert de clé de route. */
  Wrapper: ComponentType<{ children: ReactNode; pathname: string }>
  /**
   * Appelé au premier rendu de la nouvelle route, quand l'ancienne couvre
   * encore l'écran. Le reset du scroll est fait par PageTransition ; ici,
   * l'implémentation peut préparer l'élément partagé ou le rideau.
   */
  onCovered?: (pathname: string) => void
  /** Appelé quand la nouvelle page est prête (polices, images) et visible. */
  onRevealed?: (pathname: string) => void
}
