'use client'

import { useSyncExternalStore, ViewTransition, type ReactNode } from 'react'
import { abonnerPartage, lireCiblePartage, lireCiblePartageServeur } from '../lib/navigation-store'

interface PartageImageProps {
  /** Slug du projet : le nom de vue `projet-<slug>` apparie source et hero de fiche. */
  slug: string
  /**
   * Image source (tuile, bloc sélectionné, projet suivant) : elle ne porte le nom de vue que le
   * temps d'une transition vers son projet. Sinon une tuile s'apparierait avec le « projet
   * suivant » de la fiche d'arrivée, loin sous l'écran, et resterait plantée au-dessus de la page.
   */
  source?: boolean
  children: ReactNode
}

/** Élément partagé d'une transition de page : l'image source s'étire vers le hero de la fiche (type `partage` seulement). */
export default function PartageImage({ slug, source = false, children }: PartageImageProps) {
  const cible = useSyncExternalStore(abonnerPartage, lireCiblePartage, lireCiblePartageServeur)
  const nomme = !source || cible === slug
  return (
    <ViewTransition name={nomme ? `projet-${slug}` : undefined} share={{ partage: 'lc-partage', default: 'none' }} default="none">
      {children}
    </ViewTransition>
  )
}
