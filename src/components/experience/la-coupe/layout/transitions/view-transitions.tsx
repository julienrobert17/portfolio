'use client'

import { ViewTransition } from 'react'
import type { TransitionImplementation } from './types'

/**
 * Implémentation par l'API View Transitions. La classe `lc-page` reçoit ses
 * animations dans styles/la-coupe.css ; en Phase 1 elles durent 0 s.
 */
export const viewTransitions: TransitionImplementation = {
  nom: 'view-transitions',
  Wrapper: ({ children }) => <ViewTransition default="lc-page">{children}</ViewTransition>,
}
