'use client'

import { useRef, type ReactNode } from 'react'
import { ENTREE, useScrollAnimation } from '../lib/animation'

interface RevealTextProps {
  children: ReactNode
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'div' | 'span'
  className?: string
  /** Retard supplémentaire, en secondes. */
  delay?: number
}

/**
 * Révélation par lignes : SplitText (type lines, masque, autoSplit)
 * et glissement yPercent 100 → 0 à l'entrée dans le viewport. Les italiques
 * imbriqués survivent au split. Sans JavaScript ou sous mouvement réduit, le
 * texte est simplement là.
 */
export default function RevealText({ children, as: Tag = 'p', className, delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null)
  useScrollAnimation(ref, ({ gsap, SplitText, racine }) => {
    const split = SplitText.create(racine, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      // 'none' : aria-label est interdit sur un <p> ; le texte reste lisible dans ses lignes.
      aria: 'none',
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 100,
          duration: ENTREE.duree,
          ease: ENTREE.ease,
          stagger: ENTREE.stagger,
          delay,
          scrollTrigger: { trigger: racine, start: ENTREE.start, once: true },
        }),
    })
    return () => split.revert()
  })
  // Le ref est typé HTMLElement : l'élément réel dépend de `as`.
  const Balise = Tag as 'p'
  return (
    <Balise ref={ref as React.RefObject<HTMLParagraphElement>} className={className}>
      {children}
    </Balise>
  )
}
