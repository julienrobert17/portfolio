'use client'

import { useRef, type ReactNode } from 'react'
import { entree, useScrollAnimation } from '../lib/animation'

interface ApparitionProps {
  children: ReactNode
  as?: 'div' | 'ul' | 'ol' | 'section' | 'header' | 'dl'
  className?: string
  /** Éléments animés, relatifs au conteneur ; par défaut ses enfants directs. */
  selecteur?: string
  /** Vrai pour animer le conteneur lui-même, d'un bloc. */
  bloc?: boolean
}

/** Entrée standard (fondu + 24 px, stagger) jouée une fois à 85 % du viewport. */
export default function Apparition({ children, as: Tag = 'div', className, selecteur = ':scope > *', bloc = false }: ApparitionProps) {
  const ref = useRef<HTMLElement>(null)
  useScrollAnimation(ref, ({ gsap, racine }) => {
    const cibles = bloc ? racine : racine.querySelectorAll(selecteur)
    entree(gsap, cibles, racine)
  })
  const Balise = Tag as 'div'
  return (
    <Balise ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Balise>
  )
}
