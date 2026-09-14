import type { Evenement } from './types'

/**
 * LA FRONTIÈRE DE TRANSPORT.
 *
 * Tout ce qui est au-dessus — les routes, le client, le jeu — ne connaît que
 * cette interface. En dessous, on commence par un sondage de la base et on
 * pourra passer à un pub/sub sans qu'une ligne ne bouge plus haut.
 *
 * C'est le seul endroit où « comment on apprend qu'il s'est passé quelque
 * chose » est décidé. Si vous vous retrouvez à importer Redis ou Prisma
 * ailleurs pour savoir ça, c'est que la frontière a fui.
 */
export interface FluxTransport {
  /** Pour l'afficher dans le panneau de debug. */
  readonly nom: string

  /**
   * Attend qu'il se passe quelque chose après l'événement `depuis`.
   *
   * Rend les événements suivants dès qu'il y en a, ou une liste vide si rien
   * n'arrive avant l'expiration — auquel cas l'appelant renvoie un battement
   * et rappelle. Doit s'interrompre proprement sur `signal`.
   */
  attendre(salleCode: string, depuis: number, signal: AbortSignal): Promise<Evenement[]>

  /**
   * Signale qu'un événement vient d'être écrit.
   *
   * Sans effet pour un transport qui sonde — le sondeur le trouvera tout
   * seul. C'est un pub/sub qui en fera quelque chose.
   */
  publier(salleCode: string, id: number): Promise<void>
}
