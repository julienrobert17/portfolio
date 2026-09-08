'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PERSO } from '../content'

interface CatPhotoProps {
  alt: string
  sizes?: string
}

/**
 * La photo du chat. Tant que le fichier n'est pas déposé dans /public,
 * on retombe sur un emoji : aucun écran ne se casse en attendant.
 */
export default function CatPhoto({ alt, sizes = '120px' }: CatPhotoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span role="img" aria-label={alt} style={{ fontSize: '2rem', lineHeight: 1 }}>
        🐈
      </span>
    )
  }

  return (
    <Image
      src={PERSO.chat.photo}
      alt={alt}
      fill
      sizes={sizes}
      style={{ objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  )
}
