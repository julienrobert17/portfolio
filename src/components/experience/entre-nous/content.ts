/**
 * TOUS les textes de l'expérience vivent ici, y compris la banque de questions.
 * Rien n'est écrit en dur dans un composant.
 */
import type { Cote } from './types'

/** Les deux participants. Aucun clavier : les prénoms sont ici, on les attribue d'un tap. */
export const NOMS: Record<Cote, string> = { a: 'Mathilde', b: 'Julien' }

export const UI = {
  calibration: {
    titre: 'Comment êtes-vous installés ?',
    sous: 'Posez le téléphone entre vous. On s’adapte à votre position.',
    faceAFace: 'Face à face',
    faceAFaceAide: 'téléphone à plat entre vous',
    coteACote: 'Côte à côte',
    coteACoteAide: 'vous regardez dans le même sens',
    qui: 'Qui est de quel côté ?',
    quiAide: 'Touchez votre moitié pour vous y installer.',
    commencer: 'Commencer',
    inverser: 'Échanger les côtés',
  },
  reprise: {
    titre: 'Vous étiez déjà en route.',
    sous: 'On peut reprendre là où vous vous êtes arrêtés.',
    reprendre: 'Reprendre où vous en étiez',
    recommencer: 'Repartir du début',
  },
  jeu: {
    valider: 'Valider',
    modifier: 'Modifier',
    attente: 'de l’autre côté, ça réfléchit encore',
    passer: 'passer cette question',
    passee: 'passée',
    continuer: 'Continuer',
    /** Le pari : on répond pour soi, puis on devine l'autre. */
    pariSoi: 'Toi',
    /* Volontairement sans accord : la même chaîne sert aux deux côtés. */
    pariAutre: 'Et {nom} ?',
    pariSuivant: 'Puis deviner',
    revToi: 'toi',
    revDevine: '{nom} avait deviné',
    revTuAvais: 'tu avais deviné',
    /* La mécanique sans écran : rien à saisir, un bouton par côté. */
    aVoixHaute: 'À dire à voix haute, tous les deux. Il n’y a rien à saisir.',
    cestDit: 'c’est dit',
    ditEnsemble: 'vous l’avez dit.',
    /* Le tir à la corde : un seul curseur, deux mains dessus. */
    tirer: 'Un seul curseur. Tirez chacun de votre côté.',
    lacher: 'Je lâche',
  },
  /**
   * Une respiration entre deux actes, et une seule phrase pour annoncer le
   * changement de registre. C'est aussi le moment où la ligne s'amincit : on
   * la laisse parler toute seule, on ne la commente pas.
   */
  interludes: {
    2: {
      titre: 'À partir d’ici, on avoue.',
      sous: 'Rien de grave. Juste les choses qu’on ne raconte pas à table.',
    },
    3: {
      titre: 'On ralentit.',
      sous: 'Les dernières demandent un peu plus. Vous avez tout votre temps.',
    },
  },
  /** Premier temps de la fin : la ligne s'en va, l'écran redevient entier. */
  couture: {
    titre: 'Voilà.',
    sous: 'L’écran n’est plus coupé en deux. Vous pouvez le prendre à deux mains.',
    continuer: 'Continuer',
  },
  /**
   * Deuxième temps. Aucun score, aucun pourcentage, aucun verdict de
   * compatibilité : ce n'est pas un test, c'est une liste de sujets. Les
   * distances servent à trier, elles ne s'affichent jamais.
   */
  ordreDuJour: {
    titre: 'De quoi parler ce soir.',
    sous: 'Ni bonnes ni mauvaises réponses. Juste les endroits où il se passe quelque chose.',
    loin: 'Là où vous n’êtes pas d’accord',
    proche: 'Là où vous n’avez pas hésité',
    pari: 'Là où l’un s’est trompé sur l’autre',
    /** Affiché à la place des listes quand il n'y a rien à trier. */
    vide: 'Vous avez passé presque tout. C’est une réponse aussi.',
    continuer: 'La dernière',
    devineParInterp: '{nom} pensait : {valeur}',
    reponduParInterp: '{nom} a répondu : {valeur}',
  },
  /**
   * Troisième temps. Une question, rien autour. Pas de champ, pas de bouton,
   * pas de partage, pas de « recommencer » : l'écran s'éteint et c'est tout.
   */
  derniere: {
    question: 'Qu’est-ce qu’on ne s’est jamais demandé ?',
    consigne: 'Posez-la-vous à voix haute. Il n’y a rien à valider.',
  },
  /**
   * Les questions écrites par l'un pour l'autre s'annoncent. Le marqueur doit
   * créer un petit changement de température quand la carte arrive — assumé,
   * mais discret : une ligne en laiton, pas une fanfare.
   */
  perso: {
    pour: 'écrite par {auteur}, pour toi',
    auteur: 'c’est toi qui l’as écrite',
    /** Repli si l'auteur du fichier ne correspond à aucun des deux prénoms. */
    neutre: 'écrite par {auteur}',
    signature: '— {auteur}',
  },
} as const
