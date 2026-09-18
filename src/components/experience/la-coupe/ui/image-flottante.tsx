'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'
import { onTick } from '../lib/ticker'
import styles from './image-flottante.module.css'

const LARGEUR = 200
const HAUTEUR = 260
const LERP = 0.12
const ROTATION_MAX = 3
const MARGE_FOCUS = 16

/**
 * Image 200 × 260 qui suit le curseur au survol des lignes `[data-image]`
 * du conteneur parent (lerp 0,12, rotation ±3° selon la vélocité, fondu
 * 250 ms), pointeur fin seulement. Au focus clavier, la même image apparaît
 * ancrée à droite de la ligne. Rien au tactile. À placer dans la liste.
 */
export default function ImageFlottante() {
  const ref = useRef<HTMLDivElement>(null)
  useScrollAnimation(ref, ({ gsap, racine, fin }) => {
    const conteneur = racine.parentElement
    const img = racine.querySelector('img')
    if (!conteneur || !img) return
    const lignes = Array.from(conteneur.querySelectorAll<HTMLElement>('[data-image]'))
    const etat = { x: 0, y: 0, cx: 0, cy: 0, visible: false, ancree: false, vx: 0 }
    const montrer = (src: string, alt: string) => {
      if (img.getAttribute('src') !== src) {
        img.src = src
        img.alt = alt
      }
      etat.visible = true
      gsap.to(racine, { opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: true })
    }
    const cacher = () => {
      etat.visible = false
      etat.ancree = false
      gsap.to(racine, { opacity: 0, duration: 0.25, ease: 'power2.out', overwrite: true })
    }
    const arret = onTick(() => {
      if (!etat.visible || etat.ancree) return
      const dx = etat.cx - etat.x
      etat.x += dx * LERP
      etat.y += (etat.cy - etat.y) * LERP
      etat.vx += (dx * LERP - etat.vx) * 0.2
      const rot = gsap.utils.clamp(-ROTATION_MAX, ROTATION_MAX, etat.vx * 0.15)
      racine.style.transform = `translate3d(${etat.x - LARGEUR / 2}px, ${etat.y - HAUTEUR / 2}px, 0) rotate(${rot}deg)`
    })
    const ecouteurs: Array<() => void> = [arret]

    if (fin) {
      const entrer = (e: PointerEvent) => {
        const ligne = e.currentTarget as HTMLElement
        etat.ancree = false
        etat.cx = e.clientX
        etat.cy = e.clientY
        if (!etat.visible) {
          etat.x = e.clientX
          etat.y = e.clientY
        }
        montrer(ligne.dataset.image ?? '', ligne.dataset.imageAlt ?? '')
      }
      const bouger = (e: PointerEvent) => {
        etat.cx = e.clientX
        etat.cy = e.clientY
      }
      for (const ligne of lignes) {
        ligne.addEventListener('pointerenter', entrer)
        ligne.addEventListener('pointermove', bouger, { passive: true })
        ligne.addEventListener('pointerleave', cacher)
        ecouteurs.push(() => {
          ligne.removeEventListener('pointerenter', entrer)
          ligne.removeEventListener('pointermove', bouger)
          ligne.removeEventListener('pointerleave', cacher)
        })
      }
    }

    // Clavier : ancrée à droite de la ligne, sans suivi.
    const focus = (e: FocusEvent) => {
      const ligne = (e.target as HTMLElement).closest<HTMLElement>('[data-image]')
      if (!ligne) return
      const r = ligne.getBoundingClientRect()
      etat.ancree = true
      racine.style.transform = `translate3d(${r.right - LARGEUR - MARGE_FOCUS}px, ${r.top + r.height / 2 - HAUTEUR / 2}px, 0) rotate(0deg)`
      montrer(ligne.dataset.image ?? '', ligne.dataset.imageAlt ?? '')
    }
    const blur = (e: FocusEvent) => {
      const suivant = e.relatedTarget as HTMLElement | null
      if (!suivant || !conteneur.contains(suivant)) cacher()
    }
    conteneur.addEventListener('focusin', focus)
    conteneur.addEventListener('focusout', blur)
    ecouteurs.push(() => {
      conteneur.removeEventListener('focusin', focus)
      conteneur.removeEventListener('focusout', blur)
    })
    return () => ecouteurs.forEach((fn) => fn())
  })
  return (
    <div ref={ref} className={styles.flottante} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- source changée à la volée */}
      <img alt="" width={LARGEUR} height={HAUTEUR} loading="lazy" decoding="async" />
    </div>
  )
}
