'use client'

import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

let enregistre = false

/**
 * Enregistre les plugins une seule fois. À appeler depuis un composant client
 * uniquement : les plugins touchent `window` à l'enregistrement.
 */
export function registerGsap() {
  if (!enregistre && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin)
    enregistre = true
  }
  return { gsap, ScrollTrigger, SplitText, Flip, DrawSVGPlugin }
}
