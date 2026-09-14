import { transportSondage } from './transport-sondage'
import type { FluxTransport } from './transport'

/**
 * Le transport en service. Un seul endroit à changer le jour où l'on passe au
 * pub/sub — et ce jour-là, rien au-dessus de cette ligne ne doit bouger.
 */
export const flux: FluxTransport = transportSondage
