'use client'

import type { RefObject } from 'react'
import { useEffect } from 'react'
import { registerGsap } from './gsap'

/** Règles globales du mouvement (brief §2 et Phase 3). */
export const ENTREE = {
  duree: 0.85,
  ease: 'expo.out',
  stagger: 0.06,
  /** Déclenchement à 85 % du viewport. */
  start: 'top 85%',
} as const

export const MEDIA = {
  anime: '(prefers-reduced-motion: no-preference)',
  fin: '(pointer: fine)',
  tactile: '(pointer: coarse)',
} as const

type Outils = ReturnType<typeof registerGsap>

export interface ContexteAnimation extends Outils {
  racine: HTMLElement
  /** Pointeur fin (souris, trackpad). */
  fin: boolean
  tactile: boolean
}

/**
 * Monte des animations dans un gsap.matchMedia scoppé à `ref` : tout est
 * annulé au démontage (`revert`), et rien n'est monté sous
 * prefers-reduced-motion. Les états initiaux viennent de GSAP (`from`),
 * jamais du CSS : sans JavaScript, tout est visible.
 */
export function useScrollAnimation(
  ref: RefObject<HTMLElement | null>,
  monter: (ctx: ContexteAnimation) => void | (() => void),
  deps: readonly unknown[] = [],
): void {
  useEffect(() => {
    const racine = ref.current
    if (!racine) return
    const outils = registerGsap()
    const mm = outils.gsap.matchMedia(racine)
    mm.add({ anime: MEDIA.anime, fin: MEDIA.fin, tactile: MEDIA.tactile }, (contexte) => {
      const c = contexte.conditions as Record<'anime' | 'fin' | 'tactile', boolean>
      if (!c.anime) return
      return monter({ ...outils, racine, fin: c.fin, tactile: c.tactile }) ?? undefined
    })
    return () => mm.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `monter` est stable par construction, les deps sont explicites
  }, deps)
}

/** Entrée standard, jouée une fois : fondu + 24 px, stagger 0,06, expo.out. */
export function entree(gsap: Outils['gsap'], cibles: gsap.TweenTarget, trigger: Element, options: gsap.TweenVars = {}) {
  return gsap.from(cibles, {
    opacity: 0,
    y: 24,
    duration: ENTREE.duree,
    ease: ENTREE.ease,
    stagger: ENTREE.stagger,
    scrollTrigger: { trigger, start: ENTREE.start, once: true },
    ...options,
  })
}
