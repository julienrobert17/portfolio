'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'
import { tracerDessin } from '../lib/dessin-animation'

interface DessinTraceProps {
  /** Sélecteur de l'ancêtre qui contient le SVG et sert de déclencheur. */
  conteneur: string
  /** Durée du tracé, en secondes. */
  duree?: number
}

/** Trace au scroll le SVG au trait de l'ancêtre `conteneur`, déclenché par celui-ci. */
export default function DessinTrace({ conteneur, duree }: DessinTraceProps) {
  const ref = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ref, ({ gsap, racine }) => {
    const parent = racine.closest<HTMLElement>(conteneur)
    const svg = parent?.querySelector('svg')
    if (!parent || !svg) return
    return tracerDessin(gsap, svg, { trigger: parent, conteneur: parent, duree })
  })
  return <span ref={ref} hidden />
}
