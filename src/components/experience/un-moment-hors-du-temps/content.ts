/**
 * TOUS les textes et réglages personnalisables de l'expérience vivent ici.
 * Aucun texte ne doit être écrit en dur dans un composant.
 * Pour ajuster une blague : édite ce fichier, rien d'autre.
 */

// ─────────────────────────────────────────────────────────────
// 1. Les constantes perso — commence par celles-ci
// ─────────────────────────────────────────────────────────────

export const PERSO = {
  elle: 'Mathilde',
  lui: 'Julien',
  /** Le surnom qu'elle utilise pour lui. Sert de signature. */
  sonSurnomPourLui: 'nounours',
  /** Le surnom qu'il utilise pour elle. Sert aux moments tendres. */
  monSurnomPourElle: 'mon canard en sucre',
  chat: {
    nom: 'Mimi',
    /** Carré recadré sur la tête : les vignettes font 48px, la photo
     *  d'origine y réduirait le chat à quelques pixels. */
    photo: '/experience/mimi/chat-tete.jpg',
  },
  trajet: {
    depuis: 'Pigalle',
    vers: 'Levallois',
    distance: '5,8 km',
  },
  /** Numéro WhatsApp au format international, sans + ni espaces. */
  whatsapp: '33623252069',
  /**
   * Les créneaux réellement disponibles, en nombre de jours à partir
   * d'aujourd'hui. Relatif exprès : le lien ne périme jamais.
   */
  creneauxOffsets: [4, 9, 16, 25],
  /** Heure présélectionnée, en minutes depuis minuit (19h30). */
  heureRecommandee: 19 * 60 + 30,
} as const

// ─────────────────────────────────────────────────────────────
// 2. La barre de progression — elle ment, c'est le fil rouge
// ─────────────────────────────────────────────────────────────

export const PROGRESS: readonly { value: number; note: string | null }[] = [
  { value: 0, note: null },
  { value: 12, note: null },
  { value: 87, note: null },
  { value: 87, note: 'toujours 87%, oui' },
  { value: 87, note: 'on ne bouge pas, c’est normal' },
  { value: 64, note: 'recalcul du niveau de courage' },
  { value: 96, note: null },
  { value: 103, note: 'on a dépassé les prévisions' },
]

// ─────────────────────────────────────────────────────────────
// 3. Les textes, écran par écran
// ─────────────────────────────────────────────────────────────

export const COPY = {
  back: 'Revenir',

  step0: {
    hint: 'Touche l’enveloppe.',
    title: `${PERSO.elle}, tu as reçu 1 (une) demande.`,
    titleReplay: `${PERSO.elle}, tu as reçu 1 (une) demande. Encore.`,
    from: `Expéditeur : ${PERSO.sonSurnomPourLui}. Objet : un moment hors du temps.`,
    fromReplay: 'Expéditeur : le même. Étonnamment insistant.',
    /** Ce qui est écrit sur la carte qui sort de l'enveloppe. */
    letter: 'pour toi.',
    cta: 'Commencer',
    cookies: {
      text: 'Ce site utilise des cookies. Et des fleurs. Et beaucoup de stress.',
      accept: 'Tout accepter',
      acceptSmall: 'Tout accepter (en plus petit)',
      /** Affiché une seconde après le choix, quel qu'il soit. */
      after: 'Merci. Les cookies étaient une métaphore, il n’y en a aucun.',
    },
  },

  step1: {
    title: 'Vérification d’identité',
    subtitle: 'Formalité. On y est obligés.',
    nameLabel: 'Nom',
    nameCorrection: 'Non non, c’est bien toi.',
    captchaPrompt: 'Sélectionnez toutes les images contenant une bonne raison de dire oui',
    captchaError: 'Erreur : réponse statistiquement improbable.',
    captchaSuccess: 'Toutes les réponses étaient bonnes. C’était ça, le piège.',
    robotLabel: 'Je ne suis pas un robot',
    robotAuto: '(on t’a fait confiance)',
    cta: 'Vérifier',
  },

  /**
   * Les 9 vignettes du CAPTCHA. `art` est un emoji, sauf pour la tuile
   * `photo` qui utilise PERSO.chat.photo.
   */
  captchaTiles: [
    { art: '💍', label: 'un mariage', caption: 'la scène du crime' },
    { art: 'photo', label: 'ton chat', caption: 'lui, il a déjà dit oui' },
    { art: '🍷', label: 'un verre', caption: 'argument classique mais solide' },
    { art: '🥐', label: 'un truc à manger', caption: 'toujours valable' },
    { art: '🌙', label: 'un soir', caption: 'il en reste beaucoup' },
    { art: '🎧', label: 'une chanson', caption: 'celle que tu vas mettre' },
    { art: '🚕', label: 'un trajet', caption: `${PERSO.trajet.depuis} → ${PERSO.trajet.vers}` },
    { art: '🧀', label: 'du fromage', caption: 'ne demande pas' },
    { art: '🙂', label: 'moi', caption: 'l’argument le plus faible du lot' },
  ],

  step2: {
    title: 'Bon.',
    question: 'Est-ce qu’on va boire un verre ?',
    questionReplay: 'Est-ce qu’on y retourne ?',
    yes: 'Oui',
    /** Un label par esquive. Le dernier reste si ça dépasse. */
    noLabels: [
      'Non',
      'Non ?',
      'T’es sûre ?',
      'Réfléchis bien',
      'Bon écoute…',
      'Ce bouton est en grève',
      'Je suis payé pour ne pas être cliqué',
      'Ok j’abandonne',
    ],
    /** Affiché sous les boutons quand le Non se pose enfin. */
    noSettled: 'Il s’est arrêté. Tu peux cliquer, cette fois.',
    keyboardHint: 'Les deux boutons répondent aussi à Tab et Entrée.',
    modal: {
      title: 'Ok, on arrête la blague deux secondes.',
      body: `Si c’est non, c’est non, et ça ne change rien entre nous. Vraiment rien. On se voit mercredi comme d’habitude et je ne reparle jamais de ce formulaire.`,
      joke: 'C’était pour rire',
      real: 'Vraiment non',
    },
  },

  refused: {
    title: 'C’est noté.',
    body: `Sans point d’interrogation, sans relance et sans tête d’enterrement. Merci d’être allée jusqu’au bout du truc.`,
    signature: `— ${PERSO.sonSurnomPourLui}`,
    undo: 'j’ai cliqué trop vite',
  },

  step3: {
    title: 'Quand ?',
    subtitle: 'Mon agenda est un peu tendu, je ne vais pas te mentir.',
    legendFree: 'disponible',
    legendBusy: 'indisponible',
    asap: 'Le plus tôt possible',
    asapReaction: 'voilà quelqu’un qui sait ce qu’elle veut',
    farReaction: 'c’est long.',
    cta: 'C’est noté',
    /** Piochées au hasard, mais de façon stable pour une date donnée. */
    reasons: [
      'déjà réservé par un prétendant moins drôle',
      'je suis en réunion avec mon banquier',
      'jour férié en Nouvelle-Zélande, on ne prend pas de risque',
      'mercredi, c’est mercredi',
      'j’ai promis à quelqu’un et je ne sais plus à qui',
      'incompatible avec les marées',
      'ce jour-là je fais la vaisselle',
      'bloqué pour raisons personnelles (je dors)',
      'trop proche du précédent',
      'le calendrier refuse, je n’y peux rien',
    ],
  },

  step4: {
    title: 'À quelle heure ?',
    subtitle: 'Fais glisser. Il y a une zone recommandée, mais tu fais ce que tu veux.',
    sliderLabel: 'Heure du rendez-vous',
    magnetReleased: 'très bien, va pour cette heure-là. Je note et je me tais.',
    cta: 'Parfait',
    /** Commentaires par tranche, du plus tôt au plus tard. */
    zones: [
      { until: 5 * 60, label: 'ambitieux' },
      { until: 9 * 60, label: 'on n’est pas des animaux' },
      { until: 14 * 60, label: 'très raisonnable' },
      { until: 18 * 60, label: 'entre deux' },
      { until: 21 * 60, label: 'zone recommandée' },
      { until: 23 * 60 + 30, label: 'intriguant' },
      { until: 24 * 60, label: 'je note.' },
    ],
  },

  step5: {
    title: 'On fait quoi ?',
    subtitle: 'Une seule réponse. Ou deux, je ne surveille pas.',
    otherLabel: 'Autre',
    otherPlaceholder: 'propose mieux',
    cta: 'Adjugé',
    options: [
      { id: 'restau', art: '🍝', label: 'Restau' },
      { id: 'verre', art: '🍸', label: 'Un verre' },
      { id: 'balade', art: '🌳', label: 'Balade' },
      { id: 'cine', art: '🎬', label: 'Ciné' },
    ],
    trap: {
      id: 'chacun-chez-soi',
      art: '🛋️',
      label: 'Rester chacun chez soi',
      /** Affiché ~1s après la sélection, juste avant qu'elle se décoche. */
      message: 'option temporairement indisponible pour cause de maintenance émotionnelle',
    },
    /** Suggestions absurdes, filtrées de façon très permissive. */
    suggestions: [
      'braquer une fromagerie',
      'aller voir la mer et revenir tout de suite',
      'compter les pigeons de Pigalle',
      'apprendre le morse pour rien',
      'refaire le mariage mais en mieux',
      'visiter Levallois comme des touristes',
      'monter un groupe et le dissoudre le soir même',
      'manger des huîtres sans avoir d’avis dessus',
      'aller au musée et ne regarder qu’un tableau',
      'traverser un pont, puis un autre pont',
    ],
    catBanner: {
      /** {nom} est remplacé par PERSO.chat.nom. */
      text: `{nom} reste à ${PERSO.trajet.depuis}. Toi tu viens à ${PERSO.trajet.vers}. ${PERSO.trajet.distance}.`,
      punch: 'Il a dit qu’il gérait. Il ne gérait pas.',
    },
  },

  step6: {
    title: 'Les modalités',
    subtitle: 'Deux réglages et un pavé juridique. On y est presque.',
    pressureLabel: 'Ton niveau de pression ressenti',
    pressureReaction: 'aucune pression, promis',
    probabilityLabel: 'Probabilité que tu dises oui',
    probabilityRefusal: 'le slider refuse',
    termsTitle: 'Conditions générales du moment hors du temps',
    termsCheckbox: 'J’ai lu et j’accepte les conditions ci-dessus',
    termsAuto: '(cochée automatiquement, tu as assez scrollé)',
    signedBy: `Co-signé par {nom}, en qualité de témoin.`,
    cta: 'J’accepte tout',
    clauses: [
      `L’invitant s’engage à ne pas parler de son travail plus de 4 minutes consécutives.`,
      `L’invitée conserve à tout moment le droit de dire « en fait je suis fatiguée », sans préavis ni justification.`,
      `Le terme « un verre » est fourni à titre indicatif et pourra dériver vers un dîner sans avertissement préalable.`,
      `Toute mention du mariage où les parties se sont rencontrées est autorisée, dans la limite de trois anecdotes.`,
      `L’invitant s’interdit de vérifier son téléphone, sauf pour montrer une photo de {nom}.`,
      `En cas de désaccord sur le choix du dessert, les parties s’engagent à en commander deux.`,
      `Le présent contrat prend fin au dernier métro, ou plus tard, selon un accord verbal à définir sur place.`,
    ],
  },

  step7: {
    /** Les étapes de la barre d'envoi. Total ≈ 3 secondes. */
    sending: [
      { label: 'Envoi du courage…', value: 34, hold: 700 },
      { label: 'Envoi du courage…', value: 87, hold: 600 },
      { label: 'Presque…', value: 99, hold: 500 },
      { label: 'recalcul…', value: 87, hold: 700 },
      { label: 'Envoyé.', value: 100, hold: 400 },
    ],
    ticketTitle: 'Confirmation de réservation',
    ticketSubtitle: 'à présenter à l’entrée (personne ne te la demandera)',
    fields: {
      name: 'Au nom de',
      date: 'Date',
      time: 'Heure',
      activity: 'Programme',
      ref: 'Référence',
    },
    stamp: 'approuvé par le comité félin',
    actions: {
      calendar: 'Ajouter à mon agenda',
      share: 'Envoyer ma réponse',
      restart: 'Recommencer',
      restartHint: 'ah, on refait un tour ?',
    },
    /** Message pré-rempli WhatsApp. {date} {heure} {activite} sont remplacés. */
    shareMessage: `C’est oui. {date}, {heure}, {activite}. J’ai lu les conditions générales, surtout la clause 2. — ton ${PERSO.monSurnomPourElle.replace('mon ', '')}`,
    /** Titre de l'événement .ics. */
    calendarTitle: `${PERSO.elle} & ${PERSO.lui}`,
    calendarNote: 'Un moment hors du temps. Confirmé par formulaire.',
  },
} as const

export type ActivityOption = (typeof COPY.step5.options)[number]
