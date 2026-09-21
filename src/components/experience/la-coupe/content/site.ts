import type { ImageContenu } from './types'

/**
 * Identité, navigation et textes communs. Placeholder à remplacer par le vrai
 * contenu : aucun composant ne porte de texte en dur.
 */
export const site = {
  /** Préfixe de toutes les routes de l'expérience. */
  base: '/experience/la-coupe',
  nom: 'Atelier Mireille Vasseur',
  initiales: 'MV',
  activite: 'Architecture',
  ville: 'Paris',
  fuseau: 'Europe/Paris',
  depuis: 2011,
  baseline: 'Construire des lieux qui tiennent *debout longtemps*.',
  description:
    "Atelier d'architecture à Paris. Maisons, équipements publics, logements et réhabilitations, dessinés pour durer.",

  nav: [
    { label: 'Projets', href: '/projets' },
    { label: 'Atelier', href: '/atelier' },
    { label: 'Contact', href: '/contact' },
  ],

  hero: {
    titre: ['Atelier', 'Mireille Vasseur'],
    ligne: 'Architecture — Paris — depuis 2011',
    canvasLabel:
      'Maquette blanche de la Maison des Vignes, tranchée par un plan de coupe qui descend au fil du défilement.',
  },

  manifeste: [
    'Nous dessinons des bâtiments *simples à comprendre*, faits de peu de matériaux, mis en œuvre avec soin.',
    "Un lieu réussi se reconnaît à ce qu'on y *revient sans y penser* : la lumière juste, le bon seuil, une pièce en plus.",
    'Nous préférons *transformer* plutôt que démolir, et construire ce qui pourra encore servir dans cent ans.',
  ],

  chiffres: [
    { valeur: 15, unite: 'ans' },
    { valeur: 62, unite: 'projets' },
    { valeur: 3, unite: 'prix' },
  ],

  /** Slugs des projets mis en avant sur l'accueil, dans l'ordre. */
  selection: ['maison-des-vignes', 'halle-saint-ouen', 'mediatheque-des-tanneurs', 'les-terrasses-du-canal'],

  atelierTeaser: {
    titre: "L'atelier",
    texte:
      "Six personnes, un plateau au fond d'une cour du treizième arrondissement, et des maquettes partout. Nous travaillons à toutes les échelles, du meuble au quartier, avec la même attention au détail qui tient.",
    lien: "Découvrir l'atelier",
  },

  contact: {
    email: 'bonjour@atelier-vasseur.fr',
    telephone: '+33 1 45 80 12 34',
    adresse: ['12 rue des Tanneries', '75013 Paris'],
    gps: { lat: 48.8318, lon: 2.3474 },
    horaires: 'Du lundi au vendredi, de 9 h à 18 h.',
    /** Les mêmes horaires en données : le statut de la page contact les compare à l'heure de Paris. */
    ouverture: { jours: [1, 2, 3, 4, 5], debut: 9, fin: 18 },
    statut: {
      ouvert: "L'atelier est ouvert",
      ferme: "L'atelier est fermé",
      /** Complète « L'atelier est fermé — … ». */
      demain: 'réponse demain matin',
      lundi: 'réponse lundi matin',
      /** Après l'ouverture du jour, avant la fermeture : complété par l'heure. */
      aParis: 'à {ville}',
    },
    cta: 'Un projet ?',
    intro:
      "Une maison à agrandir, un bâtiment à transformer, un concours à préparer : écrivez-nous, nous répondons sous trois jours.",
    surtitre: 'Contact — Paris 13e',
    reponse: 'Réponse sous trois jours',

    /** Composeur de la page contact : le lien mailto se construit à partir de ces textes. */
    composeur: {
      titre: 'Écrire',
      intro: "Deux indications suffisent pour commencer. Le message s'ouvre dans votre messagerie, vous le terminez à votre façon.",
      legende: 'Votre projet',
      /** `objet` suit « au sujet d’ » : tous commencent par une voyelle, l'élision vaut pour les quatre. */
      types: [
        { id: 'maison', sujet: 'Projet de maison', objet: 'une maison' },
        { id: 'rehabilitation', sujet: 'Projet de réhabilitation', objet: 'une réhabilitation' },
        { id: 'equipement', sujet: "Projet d'équipement", objet: 'un équipement public' },
        { id: 'autre', sujet: 'Un projet à part', objet: 'autre chose' },
      ],
      /** La phrase à compléter, en trois morceaux : le nom et le sujet se glissent entre eux. */
      phrase: { debut: 'Bonjour, je m’appelle ', milieu: ' et je vous écris au sujet d’', fin: '.' },
      /** Corps du message quand le nom n'est pas renseigné. */
      phraseSansNom: 'Bonjour, je vous écris au sujet d’{objet}.',
      nom: 'Votre nom',
      placeholder: 'votre nom',
      /** Nom accessible du bouton qui fait défiler les sujets, et annonce du sujet courant. */
      changerSujet: 'Changer le sujet du message',
      sujetCourant: 'Sujet : {objet}',
      ouvrir: 'Ouvrir le message',
      copier: "Copier l'adresse",
      copie: 'Adresse copiée.',
      echec: "Copie impossible : sélectionnez l'adresse ci-dessus.",
    },

    /** Venir à l'atelier : table et plan de situation. */
    venir: {
      titre: "Venir à l'atelier",
      acces: 'Porche du 12, puis au fond de la cour : la porte vitrée, à gauche.',
      stations: [
        { id: 'glaciere', nom: 'Glacière', ligne: 'M6', marche: '4 min' },
        { id: 'gobelins', nom: 'Les Gobelins', ligne: 'M7', marche: '8 min' },
      ],
      carte: 'Ouvrir dans OpenStreetMap',
      libelles: {
        adresse: 'Adresse',
        acces: 'Accès',
        horaires: 'Horaires',
        telephone: 'Téléphone',
        metro: 'Métro',
        gps: 'Coordonnées',
      },
      plan: {
        legende: 'Plan de situation',
        alt: "Plan de situation : l'atelier au fond de la cour du 12 rue des Tanneries, à quatre minutes à pied de la station Glacière et huit des Gobelins.",
        rue: 'rue des Tanneries',
        cour: 'cour',
        atelier: 'Atelier',
        nord: 'N',
        echelle: '50 m',
      },
    },

    /** Comment ça commence : trois étapes, une phrase chacune. */
    etapes: {
      titre: 'Comment ça commence',
      liste: [
        {
          id: 'echange',
          titre: 'Premier échange',
          texte: "Une heure au téléphone ou à l'atelier, sans engagement, pour comprendre ce que vous cherchez et vous dire si nous sommes *les bons*.",
        },
        {
          id: 'visite',
          titre: 'Visite du site',
          texte: "Nous venons voir le lieu avec vous, mètre et carnet en main : l'orientation, les voisins, *ce qui mérite de rester*.",
        },
        {
          id: 'esquisse',
          titre: 'Esquisse',
          texte: "Trois semaines plus tard, une esquisse, une maquette et un budget réaliste, que vous gardez *quoi qu'il arrive*.",
        },
      ],
    },
  },

  reseaux: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Are.na', href: 'https://are.na' },
  ],

  footer: {
    mentions: ['SARL d’architecture', 'Ordre des architectes, n° 0123456', 'Mentions légales'],
    credits: ['Photographies : placeholders', 'Site : la Coupe, 2026'],
  },
}

/** Images hors projets : atelier, portrait, équipe. */
export const imagesAtelier: Record<string, ImageContenu> = {
  atelier: { ratio: '3:2', alt: "Le plateau de l'atelier, table de maquettes au premier plan" },
  portrait: { ratio: '4:5', alt: 'Mireille Vasseur, portrait dans l’atelier' },
  'equipe-01': { ratio: '1:1', alt: 'Portrait de Mireille Vasseur' },
  'equipe-02': { ratio: '1:1', alt: 'Portrait de Karim Belkacem' },
  'equipe-03': { ratio: '1:1', alt: 'Portrait de Louise Ferrand' },
  'equipe-04': { ratio: '1:1', alt: 'Portrait de Tomás Herrera' },
  'equipe-05': { ratio: '1:1', alt: 'Portrait d’Anaïs Morel' },
  'equipe-06': { ratio: '1:1', alt: 'Portrait de Jules Kéita' },
  ecouter: { ratio: '16:9', alt: 'Relevé sur site, carnet et mètre ruban' },
  dessiner: { ratio: '16:9', alt: 'Calques superposés sur la table de dessin' },
  construire: { ratio: '16:9', alt: 'Chantier, ossature bois en cours de levage' },
}
