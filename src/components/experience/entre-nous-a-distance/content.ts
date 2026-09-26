/**
 * Tous les textes propres au mode à distance.
 *
 * Ceux de l'expérience d'origine restent dans `entre-nous/content.ts` : on ne
 * duplique que ce qui doit changer quand il y a deux appareils, et chaque
 * entrée d'ici est une phrase qui sonnerait faux dans l'autre mode.
 */
export const TEXTES = {
  salon: {
    titre: 'Chacun son téléphone.',
    sous: 'L’un ouvre une salle, l’autre entre le code. Vous pouvez être dans la même pièce ou pas.',
    ouvrir: 'Ouvrir une salle',
    ou: 'ou',
    rejoindre: 'Rejoindre',
    codePlaceholder: 'CODE',
    codeAide: 'Code de la salle, quatre lettres',
    votreCode: 'votre code',
    jeSuis: 'je suis {nom}',
  },
  attente: {
    bouton: 'On attend l’autre',
    commencer: 'Commencer',
    /*
     * Dit au seul moment où personne n'est pressé : on attend l'autre.
     *
     * Pas une contrainte, une évidence partagée — personne ne fait vingt
     * minutes de questions intimes en silence, chacun de son côté. Et la
     * seconde phrase dit à l'écran sa vraie place : à distance, il n'est pas
     * le lieu de la rencontre, il donne le rythme d'une conversation qui se
     * tient ailleurs.
     */
    appelez: 'Appelez-vous aussi. Ça se joue en se parlant — l’écran ne fait que donner le rythme.',
  },
  jeu: {
    question: 'question {n}',
    suivante: 'Question suivante',
    versLaFin: 'Terminer',
    /** La consigne des « à voix haute », version deux appareils. */
    aVoixHaute: 'À vous dire dans l’appel. Rien à saisir ici.',
    /** « c'est dit » suppose qu'on vient de parler à côté de soi. */
    cestDit: 'on se l’est dit',
    finDuDeroule: 'Fin du déroulé.',
    pasBranchee: 'Mécanique « {m} » — pas encore branchée à distance.',
    questionPassee: 'Cette question est passée pendant que tu répondais.',
  },
  /**
   * LA FIN, EN TROIS TEMPS — et l'ordre compte.
   *
   * « Posez les téléphones » ne peut pas ouvrir la couture : l'ordre du jour
   * qui suit se lit à l'écran, et une consigne démentie trente secondes plus
   * tard ne vaut rien. Elle ouvre donc le DERNIER temps, celui qui se joue
   * uniquement dans la voix, et plus rien après elle n'attend un geste.
   *
   * Ce que la couture dit à la place, c'est ce qui est vrai à cet instant :
   * les deux écrans viennent de devenir identiques. Pendant toute la partie
   * chacun voyait sa propre version — son prénom marqué « toi », ses réponses
   * d'abord. C'est fini, et c'est la dernière chose que l'écran fait de son
   * propre chef.
   */
  couture: {
    titre: 'Vous regardez la même chose.',
    sous: 'Pour la première fois depuis tout à l’heure, vos deux écrans sont identiques.',
    continuer: 'Continuer',
  },
  derniere: {
    poser: 'Posez les téléphones.',
    consigne: 'Ce qui suit ne se tape pas.',
    apres: 'Il n’y a rien après.',
  },
  /**
   * L'intercalaire du retour. Il ne s'affiche QUE si quelque chose a bougé
   * pendant l'absence — jamais pour un simple aller-retour.
   */
  retour: {
    titre: 'Pendant que tu étais parti…',
    questionChangee: 'On est passés à la question suivante.',
    phaseChangee: 'La partie a avancé.',
    reprendre: 'Reprendre',
  },
  lien: {
    coupe: 'La ligne est coupée. Ça revient tout seul.',
    coupeLongtemps: 'Toujours pas de lien. Regarde le wifi — rien n’est perdu.',
  },
  empreinte: {
    jeSuisEnRetard: 'C’est ce téléphone-ci qui est en retard. Recharge cette page.',
    autreEnRetard: 'C’est l’autre téléphone qui est en retard. C’est lui qu’il faut recharger.',
    indecidable: 'Impossible de dire lequel des deux est en retard. Rechargez les deux.',
    recharger: 'Recharger ce téléphone',
  },
} as const
