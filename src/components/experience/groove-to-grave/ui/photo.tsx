import type { CSSProperties } from 'react'
import { medias } from '../content/medias'

const DOSSIER = '/experience/groove-to-grave/img'

interface PhotoProps {
  /** Identifiant de media (ref de sortie, date de soirée, slug d'artiste). */
  id: string
  alt: string
  /** Attribut sizes du srcset ; par défaut la largeur de la fenêtre. */
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Image statique en AVIF et WebP générée par scripts/g2g-media.ts, sans optimiseur à la
 * volée ni recadrage : l'œuvre est servie telle quelle, ratio conservé. Rien n'est rendu
 * si le media n'existe pas (la page décide d'un repli texte).
 */
export default function Photo({ id, alt, sizes = '100vw', priority, className, style }: PhotoProps) {
  const m = medias[id]
  if (!m) return null
  const srcset = (format: 'avif' | 'webp') => m.largeurs.map((l) => `${DOSSIER}/${id}-${l}.${format} ${l}w`).join(', ')
  const plusGrande = m.largeurs[m.largeurs.length - 1]
  return (
    <picture className={className} style={style}>
      <source type="image/avif" srcSet={srcset('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset('webp')} sizes={sizes} />
      <img src={`${DOSSIER}/${id}-${plusGrande}.webp`} width={m.width} height={m.height} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding={priority ? 'sync' : 'async'} fetchPriority={priority ? 'high' : undefined} />
    </picture>
  )
}

/** Vrai si une image a été générée pour cet identifiant. */
export function aPhoto(id: string): boolean {
  return Boolean(medias[id])
}
