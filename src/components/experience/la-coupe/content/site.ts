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
    cta: 'Un projet ?',
    intro:
      "Une maison à agrandir, un bâtiment à transformer, un concours à préparer : écrivez-nous, nous répondons sous trois jours.",
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
