'use client'

import { useEffect, useRef } from 'react'
import type { ImageRendue } from '../lib/images'
import styles from './photo.module.css'

interface PhotoProps {
  image: ImageRendue
  /** Largeur affichée, pour que le navigateur prenne la bonne entrée du srcset. */
  sizes: string
  /** Image de tête : préchargée depuis le head (imagesrcset), priorité haute, sans fondu. */
  priority?: boolean
  /** Juste sous le pli : chargée d'emblée en priorité haute, sans préchargement. */
  eager?: boolean
  className?: string
  /** Remplit son conteneur (object-fit: cover) au lieu de garder son ratio. */
  cover?: boolean
}

/**
 * La seule image de contenu du site : un <picture> statique (AVIF puis WebP,
 * quatre largeurs générées par scripts/fetch-la-coupe-photos.ts), sans
 * optimiseur à la volée. Dimensions explicites et aspect-ratio donc zéro
 * décalage ; couleur dominante et LQIP visibles tout de suite sous l'image.
 * Fondu de 400 ms quand l'image arrive après l'hydratation ; déjà chargée
 * (cache, SSR rapide) ou image de tête : pas de fondu. Sans JS rien n'est caché.
 */
export default function Photo({ image, sizes, priority = false, eager = false, className, cover = false }: PhotoProps) {
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = img.current
    if (!el || priority || el.complete) return
    el.classList.add(styles.attente)
    const montrer = () => el.classList.remove(styles.attente)
    el.addEventListener('load', montrer, { once: true })
    el.addEventListener('error', montrer, { once: true })
    return () => {
      el.removeEventListener('load', montrer)
      el.removeEventListener('error', montrer)
      montrer()
    }
  }, [priority])

  return (
    <picture
      className={[styles.cadre, cover ? styles.cover : '', className ?? ''].filter(Boolean).join(' ')}
      style={{
        backgroundColor: image.couleur,
        backgroundImage: image.lqip ? `url(${image.lqip})` : undefined,
        aspectRatio: cover ? undefined : `${image.width} / ${image.height}`,
      }}
    >
      {priority && image.srcset && (
        <link rel="preload" as="image" type="image/avif" imageSrcSet={image.srcset.avif} imageSizes={sizes} fetchPriority="high" />
      )}
      {image.srcset && <source type="image/avif" srcSet={image.srcset.avif} sizes={sizes} />}
      {image.srcset && <source type="image/webp" srcSet={image.srcset.webp} sizes={sizes} />}
      <img
        ref={img}
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading={priority || eager ? 'eager' : 'lazy'}
        fetchPriority={priority || eager ? 'high' : 'auto'}
        decoding="async"
        className={styles.image}
      />
    </picture>
  )
}
