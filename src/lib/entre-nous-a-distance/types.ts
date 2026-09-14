/**
 * Le vocabulaire de la couche de session. Rien ici ne connaît le jeu : ce
 * module parle de salles, de places et d'événements, pas de questions.
 */

export type Cote = 'a' | 'b'

/** Les phases d'une salle. Elles n'avancent que dans un sens. */
export type Phase = 'lobby' | 'jeu' | 'couture' | 'ordre' | 'derniere' | 'close'

/** Les types d'événements diffusés. Le client n'en interprète pas d'autres. */
export type TypeEvenement =
  | 'instantane' /// état complet — le repli quand l'incrémental est impossible
  | 'participant' /// quelqu'un rejoint, revient, ou s'absente
  | 'phase' /// la salle a changé de phase
  | 'index' /// on est passé à la question suivante
  | 'reponse' /// un côté a validé (la valeur n'est PAS dans la charge)
  | 'revelation' /// les deux ont validé : voici les deux réponses
  | 'battement' /// signe de vie du serveur, ne change rien

export interface Evenement {
  id: number
  type: TypeEvenement
  charge: unknown
}

/** Ce qu'un client sait de la salle. C'est la seule vérité affichable. */
export interface EtatSalle {
  code: string
  graine: string
  phase: Phase
  index: number
  version: number
  places: { cote: Cote; nom: string; present: boolean }[]
}

/** Renvoyé au client quand son écriture arrive trop tard. */
export interface ConflitVersion {
  conflit: true
  attendue: number
  courante: number
  etat: EtatSalle
}

/**
 * Durée d'un bail de place, en millisecondes.
 *
 * Une place appartient à un `clientId` tant qu'il donne signe de vie. Passé ce
 * délai sans battement, elle peut être reprise — c'est ce qui permet de
 * revenir depuis un autre appareil, ou après avoir vidé son navigateur, sans
 * être confondu avec un intrus.
 */
export const BAIL_MS = 45_000

/**
 * Durée de vie d'une salle. Elle est jetable : on joue une fois.
 */
export const SALLE_MS = 24 * 60 * 60 * 1000

/**
 * Combien d'événements on garde avant de ne plus savoir rejouer. Au-delà, une
 * reconnexion reçoit un instantané complet plutôt qu'un rattrapage.
 */
export const FENETRE_REJEU = 200
