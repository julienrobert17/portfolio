'use client'

import type gsapType from 'gsap'

type Gsap = typeof gsapType

let promesse: Promise<Gsap> | null = null

/**
 * GSAP chargé à la demande, hors du JavaScript initial (Phase 6, performance) : il ne sert
 * qu'aux tweens de l'insertion et de la transition de page, jamais avant le LCP. Écart
 * volontaire à la copie de la-coupe (brief v1.1, arbitrage 4) : pas de ScrollTrigger ici, le
 * collage à l'arrivée passe par IntersectionObserver et le ticker est natif (lib/ticker.ts).
 */
export function chargerGsap(): Promise<Gsap> {
  if (!promesse) promesse = import('gsap').then((m) => m.default)
  return promesse
}

/** Précharge GSAP pendant un temps libre, pour que la première transition soit fluide. */
export function prechargerGsap(): void {
  if (typeof window === 'undefined' || promesse) return
  const lancer = () => void chargerGsap()
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(lancer, { timeout: 3000 })
  else window.setTimeout(lancer, 1500)
}
