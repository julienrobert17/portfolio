'use client'

import type { TransitionImplementation } from './types'

/**
 * Implémentation de repli : couche maison (rideau + GSAP Flip pour l'élément
 * partagé), à compléter en Phase 4 si le flag viewTransition pose problème.
 * Aujourd'hui : passe-plat.
 */
export const flip: TransitionImplementation = {
  nom: 'flip',
  Wrapper: ({ children }) => <>{children}</>,
}
