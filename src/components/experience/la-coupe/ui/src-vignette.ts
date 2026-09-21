import { getImageProps } from 'next/image'
import type { ImageRendue } from '../lib/images'

/**
 * URL optimisée d'une petite version de l'image (image flottante 200 × 260 de
 * l'index et de l'équipe) : l'élément <img> de ImageFlottante change de source
 * à la volée et ne peut pas être un next/image, mais il en reçoit l'URL.
 */
export function srcVignette(image: ImageRendue): string {
  return getImageProps({ src: image.src, width: 400, height: 520, alt: '' }).props.src
}
