'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'
import { tracerDessin } from '../lib/dessin-animation'

interface DessinAnimeProps {
  /** Élément déclencheur, sinon le dessin lui-même. */
  trigger?: string
}

/** Trace le SVG voisin (dans la même figure) à l'entrée dans le viewport. */
export default function DessinAnime({ trigger }: DessinAnimeProps) {
  const ref = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ref, ({ gsap, racine }) => {
    const figure = racine.closest('figure')
    const svg = figure?.querySelector('svg')
    if (!figure || !svg) return
    tracerDessin(gsap, svg, { conteneur: figure, trigger: trigger ? (racine.closest(trigger) ?? undefined) : undefined })
  })
  return <span ref={ref} hidden />
}
