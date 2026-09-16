'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let enregistre = false

/**
 * Enregistre les plugins une seule fois. À appeler depuis un composant client
 * uniquement : les plugins touchent `window` à l'enregistrement.
 */
export function registerGsap() {
  if (!enregistre && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
    enregistre = true
  }
  return { gsap, ScrollTrigger }
}
