'use client'

import { ViewTransition } from 'react'
import type { TransitionImplementation } from './types'

/**
 * Implémentation par l'API View Transitions (React). Le type de transition
 * vient du lien (`transitionTypes`) : `partage` = l'élément partagé s'étire et
 * la page s'estompe ; tout le reste (rideau, menu, continu, retour navigateur)
 * est à `none` : la page est remplacée d'un coup sous sa couverture, jamais de
 * fondu croisé ni de superposition. Classes dans
 * styles/la-coupe.css.
 */
export const viewTransitions: TransitionImplementation = {
  nom: 'view-transitions',
  Wrapper: ({ children }) => (
    <ViewTransition default={{ partage: 'lc-page-partage', default: 'none' }}>{children}</ViewTransition>
  ),
}
