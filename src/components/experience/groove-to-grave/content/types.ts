/**
 * Types du contenu de « Groove To Grave ». Tout fait public porte ses sources
 * et son état de vérification ; tout texte de notre main porte `draft: true`.
 */

/** Genres des presets du lecteur (filtre du catalogue et courbe d'égalisation). */
export type Genre = 'house' | 'break' | 'minimal' | 'electro'
export type Preset = Genre | 'tout'

export interface Provenance {
  /** URL publiques consultées. */
  sources: string[]
  /** Vrai seulement si chaque fait de l'entrée est lu sur une page source. */
  verified: boolean
  /** Champs lus sur un support non lisible avec certitude (étiquette du disque), à faire valider. */
  aVerifier?: string[]
}

/** Texte publié : langue d'origine conservée, `draft` si écrit par nous et à faire valider par le label. */
export interface Texte {
  lang: 'fr' | 'en'
  body: string
  draft?: true
}

/** Origine d'un extrait : fichier du label traité par le pipeline, ou boucle synthétique provisoire. */
export type OrigineMedia = 'label' | 'provisoire'

/** Extrait audio d'une piste (60 s, −14 LUFS), servi depuis le CDN Sanity (pipeline de la Phase 7.4). */
export interface Extrait {
  src: string
  /** Durée réelle du fichier, en secondes. */
  duration: number
  origine: OrigineMedia
  /** BPM estimé par le pipeline (ou celui de la boucle provisoire) : vitesse des bobines et de la bande. */
  bpm?: number
}

/** Une largeur d'une image optimisée : AVIF et WebP sans recadrage, chaque fichier sous 300 kB. */
export interface TailleImage {
  largeur: number
  hauteur: number
  avif: string
  webp: string
}

/** Image optimisée par le pipeline (pochette, flyer, portrait), servie depuis le CDN Sanity. */
export interface ImageSite {
  largeur: number
  hauteur: number
  /** Largeurs croissantes, pour le srcset. */
  tailles: TailleImage[]
  /** Texte alternatif saisi par le label (obligatoire dans le Studio). */
  alt?: string
  credit?: string
}

export interface Piste {
  /** `gtgr05-a1`, `gtgrva02-3` : identifiant stable, clé des manifestes médias. */
  id: string
  /** Position imprimée : A1, B2… pour un vinyle ; 1 à 8 pour une compilation. */
  position: string
  title: string
  /** Artiste de la piste, pour les compilations. */
  artist?: string
  /** Durée du morceau complet en secondes, d'après Bandcamp. */
  duration: number
  /** Bonus numérique absent du vinyle. */
  digitalOnly?: true
  extrait?: Extrait
}

export type StatutSortie = 'disponible' | 'epuise' | 'numerique'

export type FormatSortie = '12″ vinyle' | 'EP numérique' | 'compilation numérique'

export interface Credits {
  artwork?: string
  mastering?: string
  distribution?: string
  ar?: string
}

export interface Sortie extends Provenance {
  /** Slug de l'URL : `gtgr05`, `gtgrva02`. */
  ref: string
  /** Référence de catalogue imprimée : GTGR05. */
  catalog: string
  /** Vinyle 12″ de la série GTGR, EP numérique de la même série, ou compilation numérique (GTGRVA). */
  kind: 'vinyle' | 'ep-numerique' | 'compilation'
  /** Format imprimé sur la cassette et la page : « 12″ vinyle », « EP numérique », « compilation numérique ». */
  format: FormatSortie
  /** Slug d'artiste pour une sortie solo, absent pour une compilation. */
  artistSlug?: string
  artistName: string
  title: string
  /** ISO, date de sortie annoncée par le label (Bandcamp). */
  releaseDate: string
  status: StatutSortie
  /** Pressage limité sans repress, d'après Bandcamp. */
  noRepress: boolean
  /** Genres déduits des descriptions publiques, jamais confirmés par le label (`genresVerified`). */
  genres: Genre[]
  genresVerified: false
  text?: Texte
  credits: Credits
  links: { bandcamp: string; [shop: string]: string }
  tracks: Piste[]
  /** Pochette optimisée par le pipeline, absente tant qu'il n'a pas tourné. */
  pochette?: ImageSite
  /** Couleurs de cassette extraites de la pochette, absentes tant que le pipeline n'a pas tourné. */
  couleurs?: Couleurs
}

export interface Lien {
  label: string
  url: string
}

export interface Artiste extends Provenance {
  slug: string
  name: string
  /** Ville, seulement si une source la donne. */
  city?: string
  /** Rôle dans le collectif, pour les membres du crew. */
  role?: string
  /** Présentation factuelle tirée des textes publics, langue d'origine ; `draft` si reformulée par nous. */
  presentation?: Texte
  /** Refs des sorties sur le label (solo ou piste de compilation). */
  releases: string[]
  links: Lien[]
  portrait?: ImageSite
}

export type StatutSoiree = 'passee' | 'a-venir' | 'annulee' | 'reportee'

export interface Soiree extends Provenance {
  /** Date ISO, identifiant de la soirée et clé des manifestes médias. */
  date: string
  /** Nom de la soirée s'il y en a un. */
  name?: string
  venue: string
  address?: string
  city: string
  hours?: string
  lineup: string[]
  status: StatutSoiree
  price?: string
  description?: Texte
  ticketing?: string
  /** Flyer optimisé par le pipeline, jamais recadré. */
  flyer?: ImageSite
  /** Crédit du visuel quand il est connu. */
  flyerCredit?: string
}

export interface Couleurs {
  /** Couleur dominante de la pochette : coque de la cassette. */
  dominant: string
  /** Couleur d'accent : bande de l'étiquette. */
  accent: string
  /** Contraste WCAG de `ink` sur chaque couleur : en dessous de 3:1, le texte posé dessus passe en `poster`. */
  contrasteInk: { dominant: number; accent: number }
  /** Contraste WCAG de `poster` sur chaque couleur. */
  contrastePoster: { dominant: number; accent: number }
}
