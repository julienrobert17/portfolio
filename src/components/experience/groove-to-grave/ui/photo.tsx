import type { CSSProperties } from 'react'
import type { ImageSite } from '../content/types'

interface PhotoProps {
  image: ImageSite
  /** Texte alternatif de repli ; celui saisi par le label dans le Studio l'emporte. */
  alt: string
  /** Attribut sizes du srcset ; par défaut la largeur de la fenêtre. */
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Image optimisée par le pipeline (AVIF et WebP par largeur, jamais recadrée ni retouchée, servie
 * depuis le CDN Sanity) : l'œuvre est servie telle quelle, ratio conservé. La page décide d'un
 * repli (cassette, affiche) quand l'image n'existe pas.
 */
export default function Photo({ image, alt, sizes = '100vw', priority, className, style }: PhotoProps) {
  const srcset = (format: 'avif' | 'webp') => image.tailles.map((t) => `${t[format]} ${t.largeur}w`).join(', ')
  const grande = image.tailles[image.tailles.length - 1]
  return (
    <picture className={className} style={style}>
      <source type="image/avif" srcSet={srcset('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset('webp')} sizes={sizes} />
      <img src={grande.webp} width={image.largeur} height={image.hauteur} alt={image.alt ?? alt} loading={priority ? 'eager' : 'lazy'} decoding={priority ? 'sync' : 'async'} fetchPriority={priority ? 'high' : undefined} />
    </picture>
  )
}

/** Plus petite largeur WebP d'une image (vignette de la Media Session), ou rien. */
export function vignette(image: ImageSite | undefined): string | undefined {
  return image?.tailles[0]?.webp
}
