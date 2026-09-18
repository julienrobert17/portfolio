'use client'

import { useRef } from 'react'
import { ENTREE, entree, useScrollAnimation } from '../lib/animation'

/**
 * Côté client du hero de fiche : l'image de tête est révélée par clip-path
 * depuis le bas au montage (1,1 s, sans ScrollTrigger), puis le numéro et le
 * sous-titre entrent en cascade standard. Le titre passe par RevealText.
 * Ancre : un span caché dans le <header>.
 */
export default function FicheHeroAnime() {
  const ancre = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ancre, ({ gsap, racine }) => {
    const header = racine.closest('header')
    const image = header?.querySelector<HTMLElement>('[data-fiche="image"]')
    if (!header || !image) return
    gsap.from(image, { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: ENTREE.ease })
    const lignes = header.querySelectorAll<HTMLElement>('[data-fiche="entree"]')
    if (lignes.length) entree(gsap, lignes, header)
  })
  return <span ref={ancre} hidden />
}
