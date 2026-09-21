'use client'

import { useRef } from 'react'
import { ENTREE, useScrollAnimation } from '../lib/animation'

/** Course de parallaxe (yPercent) selon la largeur de la figure. */
const PARALLAXE = { plein: -6, autre: -12 } as const

/**
 * Côté client de la galerie : chaque image entre par clip-path depuis le bas
 * avec un léger zoom arrière (1,08 → 1), une fois, à 85 % du viewport ; chaque
 * figure suit le scroll en parallaxe différenciée (pleine largeur -6 %, les
 * autres -12 %), désactivée au tactile. Ancre : un span caché dans la section.
 */
export default function GalerieAnime() {
  const ancre = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ancre, ({ gsap, racine, tactile }) => {
    const section = racine.closest('section')
    if (!section) return
    for (const figure of section.querySelectorAll<HTMLElement>('figure')) {
      const img = figure.querySelector('img')
      if (img) {
        gsap.from(img, {
          clipPath: 'inset(100% 0 0 0)',
          scale: 1.08,
          duration: ENTREE.duree,
          ease: ENTREE.ease,
          scrollTrigger: { trigger: img, start: ENTREE.start, once: true },
        })
      }
      if (tactile) continue
      gsap.to(figure, {
        yPercent: figure.dataset.plein ? PARALLAXE.plein : PARALLAXE.autre,
        ease: 'none',
        scrollTrigger: { trigger: figure, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    }
  })
  return <span ref={ancre} hidden />
}
