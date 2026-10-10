'use client'

import type Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { prechargerGsap } from '../lib/gsap'
import { recalculerScroll, setLenis } from '../lib/lenis-store'
import { onTick } from '../lib/ticker'
import { usePageSettled } from '../lib/use-page-settled'

/**
 * Une instance Lenis, avancée par le ticker partagé. Chargée pendant un temps libre après le
 * premier rendu (hors du JavaScript initial), désactivée au tactile, où le défilement natif est
 * meilleur, et sous prefers-reduced-motion. À chaque page, recalcul de Lenis une fois polices
 * et images chargées. Adapté de la copie de la-coupe : sans ScrollTrigger.
 */
export default function SmoothScroll() {
  const reduit = useReducedMotion()
  const pathname = usePathname()

  useEffect(() => {
    prechargerGsap()
    if (reduit || window.matchMedia('(pointer: coarse)').matches) return
    let lenis: Lenis | null = null
    let off: (() => void) | null = null
    let annule = false
    const demarrer = async () => {
      const { default: Lenis } = await import('lenis')
      if (annule) return
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: false })
      setLenis(lenis)
      const instance = lenis
      off = onTick((temps) => instance.raf(temps * 1000))
    }
    const ric = typeof window.requestIdleCallback === 'function'
    const id = ric ? window.requestIdleCallback(() => void demarrer(), { timeout: 2500 }) : window.setTimeout(() => void demarrer(), 800)
    return () => {
      annule = true
      if (ric) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
      off?.()
      lenis?.destroy()
      setLenis(null)
    }
  }, [reduit])

  const onSettled = useCallback(() => {
    recalculerScroll()
  }, [])
  usePageSettled(pathname, onSettled)

  return null
}
