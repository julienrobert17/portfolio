/** Ratios d'image autorisés. Les dimensions réelles sont dans lib/images.ts. */
export type Ratio = '3:2' | '4:5' | '16:9' | '1:1'

export type Statut = 'Livré' | 'En chantier' | 'Étude'

/** Catégorie de filtrage sur l'index. Le `programme` reste un libellé libre. */
export type Categorie = 'Logement' | 'Public' | 'Réhabilitation' | 'Culture'

export interface ImageContenu {
  ratio: Ratio
  alt: string
}

/** Segment [x1, y1, x2, y2] en mètres, origine en haut à gauche du plan. */
export type Segment = [number, number, number, number]

export interface DescripteurPlan {
  type: 'plan'
  /** Emprise extérieure en mètres. */
  largeur: number
  profondeur: number
  /** Refends et cloisons, en mètres. */
  murs: Segment[]
  /** Percements dans l'enveloppe, en mètres, sur le mur bas (y = profondeur). */
  ouvertures?: [number, number][]
  legende: string
}

export interface DescripteurCoupe {
  type: 'coupe'
  largeur: number
  /** Hauteur sous plafond de chaque niveau, du bas vers le haut. */
  niveaux: number[]
  toit: 'plat' | 'deux-pentes' | 'mono'
  /** Hauteur du toit en mètres ; sinon proportionnelle à la largeur. */
  hauteurToit?: number
  /** Profondeur du sous-sol, en mètres (0 si aucun). */
  enterre?: number
  /** Position en x d'un vide traversant [debut, fin], en mètres. */
  vide?: [number, number]
  legende: string
}

export type Dessin = DescripteurPlan | DescripteurCoupe

export interface Projet {
  slug: string
  titre: string
  lieu: string
  annee: number
  /** Surface de plancher, en m². */
  surface: number
  programme: string
  categorie: Categorie
  statut: Statut
  maitriseOuvrage: string
  equipe: string[]
  /** 80 à 120 mots. Les *mots entre astérisques* passent en italique serif. */
  texte: string
  images: ImageContenu[]
  dessins: Dessin[]
  /** Teinte (0-360) des placeholders générés pour ce projet. */
  teinte: number
}

export interface Membre {
  nom: string
  role: string
  /** Identifiant d'image dans `imagesAtelier`. */
  photo: string
}

export interface Distinction {
  annee: number
  label: string
}
