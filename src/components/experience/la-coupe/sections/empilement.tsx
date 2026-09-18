'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'

/**
 * Sticky stacking des projets sélectionnés. Une seule timeline en scrub sur
 * toute la section : quand le bloc suivant recouvre, le précédent passe à
 * scale 0,96 et reçoit un voile encre à 35 % ; chaque image glisse de
 * scale 1,12 à 1 sur sa durée de visibilité (le « velours », en CSS).
 */
export default function Empilement() {
  const ref = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ref, ({ gsap, racine }) => {
    const section = racine.closest('section')
    if (!section) return
    const blocs = Array.from(section.querySelectorAll<HTMLElement>('[data-bloc]'))
    const n = blocs.length
    if (n < 2) return
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
    })
    blocs.forEach((bloc, i) => {
      const image = bloc.querySelector('[data-image-bloc]')
      const voile = bloc.querySelector('[data-voile]')
      // Visible de l'entrée par le bas (i - 1) au recouvrement complet (i + 1).
      const debut = Math.max(i - 1, 0)
      const fin = Math.min(i + 1, n - 1)
      if (image && fin > debut) tl.fromTo(image, { scale: 1.12 }, { scale: 1, duration: fin - debut }, debut)
      if (i < n - 1) {
        tl.to(bloc, { scale: 0.96, duration: 1 }, i)
        if (voile) tl.to(voile, { opacity: 0.35, duration: 1 }, i)
      }
    })
  })
  return <span ref={ref} hidden />
}
