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
}

/** Texte publié : langue d'origine conservée, `draft` si écrit par nous et à faire valider par le label. */
export interface Texte {
  lang: 'fr' | 'en'
  body: string
  draft?: true
}

/** Origine d'un média, dans l'ordre de priorité du brief (§7). */
export type OrigineMedia = 'label' | 'public' | 'provisoire'

/** Extrait audio d'une piste, servi depuis public/experience/groove-to-grave/audio/. */
export interface Extrait {
  src: string
  /** Durée réelle du fichier, en secondes. */
  duration: number
  origine: OrigineMedia
  /** BPM de la boucle provisoire, sert à la vitesse des bobines et de la bande. */
  bpm?: number
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
  kind: 'vinyle' | 'compilation'
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
  /** Identifiant de l'image Bandcamp (`https://f4.bcbits.com/img/a<id>_0.jpg`) pour le script de médias. */
  bandcampArtId: number
  /** BPM provisoire de la boucle synthétisée (pas celui du morceau réel). */
  bpmProvisoire: number
  tracks: Piste[]
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
  /** URL publiques du visuel : image directe, ou page dont le script lit `og:image`. Jamais Instagram. */
  visuels?: string[]
  /** Crédit du visuel quand il est connu. */
  flyerCredit?: string
}

/** Image traitée par scripts/g2g-media.ts, servie depuis public/experience/groove-to-grave/img/. */
export interface ImageMedia {
  /** Clé : ref de sortie (pochette), date ISO (flyer) ou slug d'artiste. */
  id: string
  origine: OrigineMedia
  width: number
  height: number
  /** Largeurs générées, `<id>-<largeur>.avif|webp`. */
  largeurs: number[]
  credit?: string
  sourceUrl?: string
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
