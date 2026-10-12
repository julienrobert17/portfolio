import { preload } from 'react-dom'
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
 * repli (cassette, affiche) quand l'image n'existe pas. `priority` marque l'image LCP de la page :
 * chargement immédiat, priorité haute, et préchargement déclaré dans le head ; les autres images
 * restent en `loading="lazy"`.
 */
export default function Photo({ image, alt, sizes = '100vw', priority, className, style }: PhotoProps) {
  const srcset = (format: 'avif' | 'webp') => image.tailles.map((t) => `${t[format]} ${t.largeur}w`).join(', ')
  const grande = image.tailles[image.tailles.length - 1]
  // Image LCP de la page : React pose dans le head un <link rel="preload"> avec le même srcset et
  // le même sizes que la source AVIF ci-dessous, pour que le navigateur demande la bonne largeur
  // dès la lecture du head (sinon la requête part après la mise en page : 350 ms de retard mesurés
  // en Phase 7.4 depuis que les images viennent du CDN). Les navigateurs sans AVIF ignorent ce
  // lien (le type ne correspond pas) et chargent le WebP de <picture> comme avant.
  if (priority) preload(grande.avif, { as: 'image', type: 'image/avif', imageSrcSet: srcset('avif'), imageSizes: sizes, fetchPriority: 'high' })
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
