'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { registerGsap } from '../lib/gsap'
import { setLenis } from '../lib/lenis-store'

/**
 * Une instance Lenis, une seule boucle : Lenis avance sur le ticker GSAP,
 * que le canvas R3F partagera (Phase 2). Désactivé au tactile, où le
 * défilement natif est meilleur, et sous prefers-reduced-motion.
 */
interface SmoothScrollProps {
  /** Faux en Phase 1 : Lenis est monté mais laissé inactif jusqu'au hero 3D (Phase 2). */
  actif?: boolean
}

export default function SmoothScroll({ actif = true }: SmoothScrollProps) {
  const reduit = useReducedMotion()
  const { gsap, ScrollTrigger } = registerGsap()

  useEffect(() => {
    if (!actif || reduit || window.matchMedia('(pointer: coarse)').matches) return

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: false })
    setLenis(lenis)
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (temps: number) => lenis.raf(temps * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [actif, reduit, gsap, ScrollTrigger])

  return null
}
