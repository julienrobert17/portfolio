import { photos } from '../content/credits'
import { site } from '../content/site'
import type { ImageContenu, Projet, Ratio } from '../content/types'

/**
 * Dimensions par ratio : 1920 px au plus sur le grand côté. Les photos sont
 * recadrées à ces tailles par scripts/fetch-la-coupe-photos.ts ; les
 * placeholders SVG de repli sont vectoriels et prennent les mêmes.
 */
export const DIMENSIONS: Record<Ratio, { width: number; height: number }> = {
  '3:2': { width: 1920, height: 1280 },
  '4:5': { width: 1536, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1440, height: 1440 },
}

export interface ImageRendue {
  src: string
  width: number
  height: number
  alt: string
  ratio: Ratio
  /** Couleur dominante de la photo, ou rien pour un placeholder. */
  couleur?: string
}

const DOSSIER = `${site.base}/img`

/** Clé d'une image de projet : `<slug>-01`, `<slug>-02`… */
export function cleProjet(slug: string, index: number): string {
  return `${slug}-${String(index + 1).padStart(2, '0')}`
}

export function cleAtelier(id: string): string {
  return `atelier-${id}`
}

/** Photo WebP si elle a été téléchargée (content/credits.ts), sinon le placeholder SVG. */
function rendre(cle: string, image: ImageContenu): ImageRendue {
  const photo = photos[cle]
  if (photo) return { src: `${DOSSIER}/${cle}.webp`, width: photo.width, height: photo.height, couleur: photo.couleur, alt: image.alt, ratio: image.ratio }
  return { ...DIMENSIONS[image.ratio], src: `${DOSSIER}/${cle}.svg`, alt: image.alt, ratio: image.ratio }
}

export function imageProjet(projet: Pick<Projet, 'slug' | 'images'>, index: number): ImageRendue {
  return rendre(cleProjet(projet.slug, index), projet.images[index])
}

export function imageAtelier(id: string, image: ImageContenu): ImageRendue {
  return rendre(cleAtelier(id), image)
}

/** Nom de fichier tel que les scripts de génération l'écrivent dans public/. */
export function nomFichier(src: string): string {
  return src.slice(src.lastIndexOf('/') + 1)
}
