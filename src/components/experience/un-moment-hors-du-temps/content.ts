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
  /** Numéro WhatsApp au format international, sans + ni espaces. */
  whatsapp: '33623252069',
  /**
   * Les AUTRES créneaux disponibles, en nombre de jours à partir d'aujourd'hui.
   * Le meilleur créneau — aujourd'hui — est ajouté au runtime : il n'est pas
   * listé ici. Relatif exprès : le lien ne périme jamais.
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
    title: `${PERSO.elle}, tu es l'heureuse élue, félicitations`,
    from: `Le papa d'Oscar`,
    /** Ce qui est écrit sur la carte qui sort de l'enveloppe. */
    letter: 'mon canard en sucre',
    cta: 'Commencer',
    cookies: {
      text: 'Ce site n’utilise pas de cookies, mais c’est pour faire genre.',
      accept: 'Tout accepter',
    },
  },

  step1: {
    title: 'Vérification d’identité',
    subtitle: 'Formalité. On y est obligés.',
    nameLabel: 'Nom',
    nameCorrection: 'Non non, c’est bien toi.',
    captchaPrompt: 'Sélectionnez tous les seaux.',
    /** Les deux premiers essais échouent toujours : rien ne permet de trancher. */
    captchaTaunts: [
      'Raté. Un seau, Mathilde. Pas un vase.',
      'Toujours pas. On te jure que c’était faisable.',
    ],
    /** 3e affichage : on abandonne le gag, tout le monde passe. */
    captchaSimplePrompt: 'Cliquez sur le seau.',
    captchaSimpleNote: 'On a simplifié.',
    captchaSuccess: 'Voilà. C’était pas si dur.',
    robotLabel: 'Je ne suis pas un robot',
    robotAuto: '(on t’a fait confiance)',
    cta: 'Vérifier',
  },

  /**
   * Les 9 vignettes du CAPTCHA. `art` est un emoji, sauf pour la tuile
   * `photo` qui utilise PERSO.chat.photo.
   */
  /**
   * Les 9 contenants du CAPTCHA. Ils se ressemblent tous, c'est le but.
   * Aucun libellé n'est exposé : les aria-label restent neutres
   * (« contenant 1 »…) pour qu'un lecteur d'écran ne vende pas la mèche.
   */
  captchaVessels: [
    'seau',
    'bassine',
    'seille',
    'arrosoir',
    'pot',
    'saladier',
    'marmite',
    'bac',
    'vase',
  ],

  step2: {
    title: 'Bon.',
    question: 'Est-ce que tu as envie de me voir ?',
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
    /** Sous chaque décompte des autres dates. */
    countdownSuffix: 'c’est long',
    /** Le meilleur créneau, c'est aujourd'hui. Passé 22h, on adapte. */
    todayLabel: 'Aujourd’hui',
    todayLateLabel: 'ce soir, là, maintenant',
    /** Escalade quand elle choisit une autre date. {n} = nombre de jours. */
    confirmations: [
      'Tu es sûre ? C’est dans {n} jours.',
      'Vraiment sûre ? J’ai recompté : {n} jours.',
      'Dernière chance.',
    ],
    confirmKeep: 'Je maintiens',
    confirmToday: 'Va pour aujourd’hui',
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
      { until: 9 * 60, label: 'houla' },
      { until: 18 * 60, label: 'entre deux mémos' },
      { until: 21 * 60, label: 'zone recommandée' },
      { until: 24 * 60, label: 'intriguant' },
    ],
  },

  step5: {
    title: 'On fait quoi ?',
    subtitle: 'Une seule réponse. Ou deux, je ne surveille pas.',
    otherLabel: 'Autre',
    otherPlaceholder: 'Choisis…',
    otherOptions: [
      'aller voir la mer revenir après',
      'regarder les 15 premières minutes d’un film et dormir',
      'faire les mots croisés',
      'aller au Mykonos sauna à Pigalle',
      'tout ce qui touche de près ou de loin aux papouilles',
    ],
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
    catBanner: {
      text: 'Mimi approuve ce choix d’activité, et confirme que MA-HA ça marche pas sur les chats',
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
    cta: 'J’accepte tout',
    clauses: [
      `L’invitant s’engage à laisser son portable pro à la maison.`,
      `Le terme « un verre » est fourni à titre indicatif et pourra dériver vers un dîner sans avertissement préalable.`,
      `Tous les sujets sont acceptés et doivent être abordés.`,
      `En cas d’hésitation sur le choix du restaurant, les parties s’engagent à en proposer au moins 1 chacun.`,
      `Si plusieurs desserts ont l’air bons, les parties s’engagent à partager les deux.`,
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
    stamp: 'approuvé par le chat',
    actions: {
      share: 'Envoyer ma réponse',
    },
    /** Message pré-rempli WhatsApp. {date} {heure} {activite} sont remplacés. */
    shareMessage: `C’est évidemment oui. {date}, {heure}, {activite}. J’ai lu et approuvé les conditions générales — hâte de te voir, ton canard en sucre`,
  },
} as const

export type ActivityOption = (typeof COPY.step5.options)[number]
