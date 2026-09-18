import type { ImageRendue } from '../lib/images'

interface PhotoProps {
  image: ImageRendue
  /** Attribut `sizes`, pour le jour où les vraies images passeront par next/image. */
  sizes?: string
  /** Vrai pour l'image au-dessus de la ligne de flottaison : chargée d'emblée et préchargée. */
  priority?: boolean
  /** Chargée d'emblée sans priorité haute : juste sous le pli. */
  eager?: boolean
  className?: string
  /** Remplit son conteneur (object-fit: cover) au lieu de garder son ratio. */
  cover?: boolean
}

/**
 * Image avec dimensions explicites et aspect-ratio : zéro décalage de mise en
 * page. Les placeholders sont des SVG, donc un <img> simple ; le passage à
 * next/image se fait ici, en un seul endroit.
 */
export default function Photo({ image, priority = false, eager = false, className, cover = false }: PhotoProps) {
  return (
    // Les placeholders sont des SVG : next/image n'y apporte rien et exige un flag dangereux.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      style={
        cover
          ? { width: '100%', height: '100%', objectFit: 'cover' }
          : { aspectRatio: `${image.width} / ${image.height}`, width: '100%' }
      }
    />
  )
}
