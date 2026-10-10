// Copie de src/components/experience/la-coupe/lib/gsap.ts (brief v1.1, arbitrage 4) : la-coupe n'est pas modifiée.
'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let enregistre = false

// En développement seulement : inspecter les ScrollTriggers depuis la console.
declare global {
  interface Window {
    __g2gGsap?: { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger }
  }
}

/**
 * Enregistre ScrollTrigger une seule fois. À appeler depuis un composant
 * client uniquement. Les plugins optionnels (SplitText, Flip, DrawSVG) sont
 * chargés à la demande par `chargerSplitText`, `chargerFlip`, `chargerDrawSvg`
 * : ils ne pèsent rien dans le JS initial.
 */
export function registerGsap() {
  if (!enregistre && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
    enregistre = true
    if (process.env.NODE_ENV !== 'production') window.__g2gGsap = { gsap, ScrollTrigger }
  }
  return { gsap, ScrollTrigger }
}

export async function chargerSplitText() {
  const { SplitText } = await import('gsap/SplitText')
  gsap.registerPlugin(SplitText)
  return SplitText
}

export async function chargerFlip() {
  const { Flip } = await import('gsap/Flip')
  gsap.registerPlugin(Flip)
  return Flip
}

export async function chargerDrawSvg() {
  const { DrawSVGPlugin } = await import('gsap/DrawSVGPlugin')
  gsap.registerPlugin(DrawSVGPlugin)
  return DrawSVGPlugin
}
