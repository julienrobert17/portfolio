'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'
import styles from './magnetisme.module.css'

/** Déplacement maximal vers la souris, en pixels. */
const MAX = 12

/**
 * Magnétisme des éléments `[data-magnetique]` : au survol, l'élément glisse
 * vers la souris (vecteur centre → souris, borné à 12 px, power2.out 0,3 s) ;
 * au départ, retour élastique à sa place (0,9 s). Pointeur fin seulement,
 * rien sous reduced motion. Écouteurs délégués au document : les cibles
 * ajoutées après montage (bouton « Menu ») sont couvertes sans observation.
 */
export default function Magnetisme() {
  const ref = useRef<HTMLSpanElement>(null)

  useScrollAnimation(ref, ({ gsap, fin }) => {
    if (!fin) return
    const cibleDe = (cible: EventTarget | null) =>
      cible instanceof Element ? cible.closest<HTMLElement>('[data-magnetique]') : null
    /** Cibles survolées et leur écouteur de mouvement, pour le nettoyage. */
    const suivis = new Map<HTMLElement, (e: PointerEvent) => void>()
    /** Toutes les cibles déplacées depuis le montage, à remettre en place au démontage. */
    const touchees = new Set<HTMLElement>()

    const lacher = (el: HTMLElement) => {
      const bouger = suivis.get(el)
      if (!bouger) return
      el.removeEventListener('pointermove', bouger)
      suivis.delete(el)
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' })
    }

    const entrer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const el = cibleDe(e.target)
      // Passage entre deux enfants d'une même cible, ou cible déjà suivie : rien.
      if (!el || el === cibleDe(e.relatedTarget) || suivis.has(el)) return
      const bouger = (ev: PointerEvent) => {
        // Le rectangle inclut le déplacement en cours : on le retire pour retrouver le centre au repos.
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2 - Number(gsap.getProperty(el, 'x'))
        const cy = r.top + r.height / 2 - Number(gsap.getProperty(el, 'y'))
        const dx = ev.clientX - cx
        const dy = ev.clientY - cy
        const distance = Math.hypot(dx, dy)
        const k = distance > MAX ? MAX / distance : 1
        gsap.to(el, { x: dx * k, y: dy * k, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
      }
      suivis.set(el, bouger)
      touchees.add(el)
      el.addEventListener('pointermove', bouger, { passive: true })
      bouger(e)
    }

    const sortir = (e: PointerEvent) => {
      const el = cibleDe(e.target)
      if (el && el !== cibleDe(e.relatedTarget)) lacher(el)
    }

    document.addEventListener('pointerover', entrer)
    document.addEventListener('pointerout', sortir)
    return () => {
      document.removeEventListener('pointerover', entrer)
      document.removeEventListener('pointerout', sortir)
      for (const [el, bouger] of suivis) el.removeEventListener('pointermove', bouger)
      suivis.clear()
      // Les tweens lancés depuis les écouteurs échappent au contexte matchMedia : on les tue ici.
      for (const el of touchees) {
        gsap.killTweensOf(el)
        gsap.set(el, { clearProps: 'transform' })
      }
      touchees.clear()
    }
  })

  return <span ref={ref} className={styles.ancre} aria-hidden="true" />
}
