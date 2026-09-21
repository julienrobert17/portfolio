/**
 * GÉNÉRÉ par scripts/fetch-la-coupe-photos.ts : ne pas éditer à la main.
 * `photos` : une entrée par image téléchargée (clé = nom de fichier sans
 * extension). Une image absente d'ici retombe sur son placeholder SVG.
 * `credits` : auteurs, source et URL, affichés dans « Crédits » du footer.
 */
export interface PhotoGeneree {
  width: number
  height: number
  /** Couleur dominante, affichée derrière l'image pendant son chargement. */
  couleur: string
}

export interface Credit {
  auteur: string
  source: 'Pexels' | 'Unsplash'
  /** Page de l'auteur sur la source. */
  url: string
  /** Pages des photos utilisées. */
  photos: string[]
}

export const photos: Record<string, PhotoGeneree> = {}

export const credits: Credit[] = []
