import { flip } from './flip'
import type { TransitionImplementation } from './types'
import { viewTransitions } from './view-transitions'

/** Une ligne à changer pour basculer d'implémentation. */
const CHOIX: TransitionImplementation['nom'] = 'view-transitions'

export const implementation: TransitionImplementation = CHOIX === 'view-transitions' ? viewTransitions : flip
export type { TransitionImplementation } from './types'
