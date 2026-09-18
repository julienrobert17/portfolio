'use client'

import { ViewTransition } from 'react'
import type { TransitionImplementation } from './types'

/**
 * Implémentation par l'API View Transitions (React). Le type de transition
 * vient du lien (`transitionTypes`) : `partage` = l'élément partagé s'étire et
 * la page s'estompe ; sinon (rideau, retour navigateur) l'ancienne page est
 * tenue 300 ms sous le rideau puis remplacée sans fondu. Classes dans
 * styles/la-coupe.css.
 */
export const viewTransitions: TransitionImplementation = {
  nom: 'view-transitions',
  Wrapper: ({ children }) => (
    <ViewTransition default={{ partage: 'lc-page-partage', default: 'lc-page-rideau' }}>{children}</ViewTransition>
  ),
}
