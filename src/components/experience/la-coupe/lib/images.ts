import type { ImageContenu, Projet, Ratio } from '../content/types'
import { site } from '../content/site'

/** Dimensions de rendu par ratio. Les placeholders sont générés à ces tailles. */
export const DIMENSIONS: Record<Ratio, { width: number; height: number }> = {
  '3:2': { width: 1800, height: 1200 },
  '4:5': { width: 1440, height: 1800 },
  '16:9': { width: 1920, height: 1080 },
  '1:1': { width: 1600, height: 1600 },
}

export interface ImageRendue {
  src: string
  width: number
  height: number
  alt: string
  ratio: Ratio
}

const DOSSIER = `${site.base}/img`

export function imageProjet(projet: Pick<Projet, 'slug' | 'images'>, index: number): ImageRendue {
  const image = projet.images[index]
  const n = String(index + 1).padStart(2, '0')
  return { ...DIMENSIONS[image.ratio], src: `${DOSSIER}/${projet.slug}-${n}.svg`, alt: image.alt, ratio: image.ratio }
}

export function imageAtelier(id: string, image: ImageContenu): ImageRendue {
  return { ...DIMENSIONS[image.ratio], src: `${DOSSIER}/atelier-${id}.svg`, alt: image.alt, ratio: image.ratio }
}

/** Nom de fichier tel que le script de génération l'écrit dans public/. */
export function nomFichier(src: string): string {
  return src.slice(src.lastIndexOf('/') + 1)
}
