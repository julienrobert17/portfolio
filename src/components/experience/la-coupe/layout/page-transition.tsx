'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { registerGsap } from '../lib/gsap'
import { recalculerScroll, scrollEnHaut } from '../lib/lenis-store'
import { usePageSettled } from '../lib/use-page-settled'
import { implementation } from './transitions'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Seul point de contact entre la navigation et les transitions. À chaque
 * changement de route : remise à zéro du scroll pendant que l'ancienne page
 * couvre encore l'écran, puis recalcul de Lenis et ScrollTrigger une fois les
 * polices et images de la nouvelle page chargées.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const { ScrollTrigger } = registerGsap()
  const precedent = useRef(pathname)
  const { Wrapper, onCovered, onRevealed } = implementation

  useLayoutEffect(() => {
    if (precedent.current === pathname) return
    precedent.current = pathname
    scrollEnHaut()
    onCovered?.(pathname)
  }, [pathname, onCovered])

  const onSettled = useCallback(() => {
    recalculerScroll()
    ScrollTrigger.refresh()
    onRevealed?.(pathname)
  }, [ScrollTrigger, onRevealed, pathname])
  usePageSettled(pathname, onSettled)

  return <Wrapper pathname={pathname}>{children}</Wrapper>
}
