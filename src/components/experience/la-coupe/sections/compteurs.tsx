'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'

/** Incrémente les chiffres `[data-valeur]` du parent sur 1,2 s, une fois, à l'entrée. */
export default function Compteurs() {
  const ref = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ref, ({ gsap, racine }) => {
    const parent = racine.parentElement
    if (!parent) return
    const cibles = Array.from(parent.querySelectorAll<HTMLElement>('[data-valeur]'))
    for (const cible of cibles) {
      const valeur = Number(cible.dataset.valeur)
      const proxy = { v: 0 }
      gsap.to(proxy, {
        v: valeur,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: parent, start: 'top 85%', once: true },
        onUpdate: () => {
          cible.textContent = String(Math.round(proxy.v))
        },
      })
    }
  })
  return <span ref={ref} hidden />
}
