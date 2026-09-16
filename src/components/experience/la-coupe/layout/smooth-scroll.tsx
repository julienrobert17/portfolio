'use client'

import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { registerGsap } from '../lib/gsap'
import { recalculerScroll, setLenis } from '../lib/lenis-store'
import { onTick } from '../lib/ticker'
import { usePageSettled } from '../lib/use-page-settled'

/**
 * Une instance Lenis, avancée par le ticker GSAP partagé avec le canvas.
 * Désactivé au tactile, où le défilement natif est meilleur, et sous
 * prefers-reduced-motion. À chaque page, recalcul de Lenis et de
 * ScrollTrigger une fois polices et images chargées.
 */
export default function SmoothScroll() {
  const reduit = useReducedMotion()
  const pathname = usePathname()
  const { ScrollTrigger } = registerGsap()

  useEffect(() => {
    if (reduit || window.matchMedia('(pointer: coarse)').matches) return

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: false })
    setLenis(lenis)
    lenis.on('scroll', () => ScrollTrigger.update())
    const off = onTick((temps) => lenis.raf(temps * 1000))

    return () => {
      off()
      lenis.destroy()
      setLenis(null)
    }
  }, [reduit, ScrollTrigger])

  const onSettled = useCallback(() => {
    recalculerScroll()
    ScrollTrigger.refresh()
  }, [ScrollTrigger])
  usePageSettled(pathname, onSettled)

  return null
}
