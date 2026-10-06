'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'

const AMPLITUDE = 8

/**
 * Parallaxe de l'image voisine (dans le même conteneur à overflow caché) :
 * yPercent −8 → 8 en scrub sur toute la traversée du viewport. L'image est
 * agrandie de 2 × 8 % pour ne jamais découvrir le fond. Rien au tactile ;
 * sans JavaScript, l'image est simplement à sa place.
 */
export default function ParallaxePortrait() {
  const ref = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ref, ({ gsap, racine, tactile }) => {
    if (tactile) return
    const cadre = racine.parentElement
    const img = cadre?.querySelector('img')
    if (!cadre || !img) return
    gsap.fromTo(
      img,
      { yPercent: -AMPLITUDE, scale: 1 + (2 * AMPLITUDE) / 100 },
      {
        yPercent: AMPLITUDE,
        scale: 1 + (2 * AMPLITUDE) / 100,
        ease: 'none',
        scrollTrigger: { trigger: cadre, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  })
  return <span ref={ref} hidden />
}
