/** Les huit mécaniques de réponse. Chaque question déclare la sienne. */
export type Mecanique =
  | 'bascule'
  | 'curseur'
  | 'classement'
  | 'enchere'
  | 'tir-a-la-corde'
  | 'le-mot'
  | 'a-voix-haute'

export type Acte = 1 | 2 | 3

/** Les deux moitiés de l'écran. `a` est le haut (face à face) ou la gauche. */
export type Cote = 'a' | 'b'

export type Installation = 'face-a-face' | 'cote-a-cote'

export interface Echelle {
  min: number
  max: number
  pas: number
  /** Suffixe affiché au pluriel, ex. « jours », « onglets ». */
  unite: string
  /** Suffixe au singulier. Certaines unités sont invariables (« fois »). */
  uniteSing?: string
}

/**
 * Une question telle qu'elle est jouée.
 *
 * Ce type ne porte AUCUNE trace de l'origine (banque ou fichier perso) : c'est
 * structurel, pas une convention. Les composants de jeu ne reçoivent que ça,
 * donc ils ne peuvent pas trahir une question perso, même par accident.
 */
export interface Question {
  id: string
  texte: string
  mecanique: Mecanique
  acte: Acte
  /** Bornes du curseur, options de bascule, cartes à classer, mots de la grille. */
  options?: readonly string[]
  /** Pour l'enchère et le tir à la corde. */
  echelle?: Echelle
  /** Si vrai, chacun répond aussi en devinant la réponse de l'autre. */
  pari?: boolean
  /**
   * Formulation de remplacement quand la mécanique a été rabattue sur une
   * autre (mode à distance). Une question qui dit « à deux mains » n'a plus
   * de sens dès qu'il y a deux appareils : la question reste, la phrase change.
   */
  texteADistance?: string
  /**
   * Si vrai, `buildRun` ne retirera JAMAIS cette question pour faire de la
   * place aux questions perso.
   *
   * À réserver aux questions dont la position tient la dramaturgie — en
   * pratique, la descente finale de l'acte 3. Sans ce marqueur, le sélecteur
   * traite toute la banque comme du remplissage interchangeable et peut
   * supprimer la fin qu'on a écrite.
   */
  garde?: boolean
}

/** Une entrée brute du fichier questions-perso.json. */
export interface QuestionPerso {
  texte: string
  mecanique?: Mecanique
  options?: string[]
  acte?: Acte
  /**
   * Si vrai, chacun répond aussi en devinant la réponse de l'autre.
   *
   * Le pari est la mécanique centrale du jeu : il n'y avait aucune raison de
   * le réserver à la banque. Sans effet sur `a-voix-haute` (aucune donnée) ni
   * sur `tir-a-la-corde` (deviner une valeur qu'on tient dans la main).
   */
  pari?: boolean
  /**
   * Bornes et unité d'une enchère. Sans elle, une enchère perso tombait sur
   * un repli 0–10 sans unité — soit un nombre nu, pas une question.
   * Ignorée par toutes les autres mécaniques.
   */
  echelle?: Echelle
  /** Phrase de l'auteur, révélée sous les deux réponses de sa question. */
  mot?: string
}

export interface FichierPerso {
  auteur: string
  pour: string
  questions: QuestionPerso[]
}

/**
 * Le déroulé d'une partie. L'origine des questions perso vit ici, à l'écart
 * des questions elles-mêmes : seul l'écran de révélation finale consulte
 * `perso`, jamais un composant de jeu.
 */
export interface RunPlan {
  questions: Question[]
  /** Indexé par id de question. Présent uniquement pour les questions perso. */
  perso: Record<string, { mot?: string }>
}

/** Selon la mécanique : nombre, option choisie, ou liste ordonnée. */
export type Valeur = number | string | readonly string[] | null

export interface Reponse {
  /** La réponse pour soi. */
  valeur: Valeur
  /** L'estimation de la réponse de l'autre, sur les questions en mode pari. */
  pari?: Valeur
  /** Vrai si la question a été passée. Toujours possible, jamais commentée. */
  passe?: boolean
}
