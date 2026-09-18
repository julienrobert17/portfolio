'use client'

import { ViewTransition, type ReactNode } from 'react'

interface PartageImageProps {
  /** Slug du projet : le nom de vue `projet-<slug>` apparie source et hero de fiche. */
  slug: string
  children: ReactNode
}

/** Élément partagé d'une transition de page : l'image source s'étire vers le hero de la fiche. */
export default function PartageImage({ slug, children }: PartageImageProps) {
  return (
    <ViewTransition name={`projet-${slug}`} share="lc-partage" default="none">
      {children}
    </ViewTransition>
  )
}
