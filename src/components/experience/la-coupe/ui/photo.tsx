import Image from 'next/image'
import type { ImageRendue } from '../lib/images'

interface PhotoProps {
  image: ImageRendue
  /** Largeur affichée, pour que l'optimiseur serve la bonne taille. */
  sizes: string
  /** Image de tête au-dessus du pli : préchargée, priorité haute. */
  priority?: boolean
  /** Juste sous le pli : chargée d'emblée en priorité haute, sans préchargement (il resterait inutilisé). */
  eager?: boolean
  className?: string
  /** Remplit son conteneur (object-fit: cover) au lieu de garder son ratio. */
  cover?: boolean
}

/** L'image de tête est le LCP des fiches : un cran de qualité en moins, invisible en AVIF, un tiers d'octets gagné. */
const QUALITE_TETE = 60

/**
 * La seule image de contenu du site, sur next/image : AVIF ou WebP à la
 * bonne largeur, dimensions explicites et aspect-ratio donc zéro décalage
 * de mise en page. Les placeholders SVG de repli passent sans optimisation
 * (next/image le fait de lui-même pour les .svg).
 */
export default function Photo({ image, sizes, priority = false, eager = false, className, cover = false }: PhotoProps) {
  return (
    <Image
      src={image.src}
      width={image.width}
      height={image.height}
      alt={image.alt}
      sizes={sizes}
      preload={priority}
      quality={priority ? QUALITE_TETE : undefined}
      loading={priority ? undefined : eager ? 'eager' : 'lazy'}
      fetchPriority={priority || eager ? 'high' : 'auto'}
      className={className}
      style={{
        backgroundColor: image.couleur,
        ...(cover ? { width: '100%', height: '100%', objectFit: 'cover' } : { aspectRatio: `${image.width} / ${image.height}`, width: '100%', height: 'auto' }),
      }}
    />
  )
}
