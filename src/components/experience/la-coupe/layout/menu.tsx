'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import MaquetteStatique from '../canvas/maquette-statique'
import { projets } from '../content/projets'
import { site } from '../content/site'
import { EASE_UI } from '../lib/easings'
import { formatNumero } from '../lib/format'
import { registerGsap } from '../lib/gsap'
import { abonnerHero, hero, lireCanvasPret, lireFaux } from '../lib/hero-store'
import { getLenis } from '../lib/lenis-store'
import { abonnerMenu, lireMenu, lireMenuServeur, naviguer, setMenuOuvert } from '../lib/navigation-store'
import LienTransition from './lien-transition'
import styles from './menu.module.css'

const FOCALISABLES = 'a[href], button:not([disabled])'
const REDUIT = '(prefers-reduced-motion: reduce)'

/**
 * Menu plein écran : rideau encre qui descend (800 ms), pages en display à
 * gauche, les huit projets en mono à droite, la maquette en fil de fer derrière
 * (canvas en mode menu, ou le SVG statique tant que three n'est pas là). Focus
 * piégé, `main` inerte, Lenis arrêté. Fermeture : Échap, fond, bouton.
 */
export default function Menu() {
  const ouvert = useSyncExternalStore(abonnerMenu, lireMenu, lireMenuServeur)
  const canvasPret = useSyncExternalStore(abonnerHero, lireCanvasPret, lireFaux)
  const overlay = useRef<HTMLDivElement>(null)
  const fond = useRef<HTMLDivElement>(null)
  const premierRendu = useRef(true)

  useEffect(() => {
    const el = overlay.current
    const bg = fond.current
    if (!el || !bg) return
    const couches = [bg, el]
    const { gsap } = registerGsap()
    const reduit = window.matchMedia(REDUIT).matches
    const main = document.getElementById('contenu')
    const liens = el.querySelectorAll<HTMLElement>('[data-menu-item]')

    if (ouvert) {
      getLenis()?.stop()
      if (main) main.inert = true
      el.hidden = false
      bg.hidden = false
      hero.sale = true
      if (reduit) {
        gsap.fromTo(couches, { '--bas': '0%', opacity: 0 }, { opacity: 1, duration: 0.2 })
      } else {
        gsap.fromTo(couches, { '--bas': '100%', opacity: 1 }, { '--bas': '0%', duration: 0.8, ease: EASE_UI })
        gsap.from(liens, { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.3 })
      }
      const premier = el.querySelector<HTMLElement>(FOCALISABLES)
      premier?.focus({ preventScroll: true })

      const auClavier = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setMenuOuvert(false)
          return
        }
        if (e.key !== 'Tab') return
        const focalisables = Array.from(el.querySelectorAll<HTMLElement>(FOCALISABLES))
        const bouton = document.querySelector<HTMLElement>('[data-menu-bouton]')
        if (bouton) focalisables.push(bouton)
        if (focalisables.length === 0) return
        const i = focalisables.indexOf(document.activeElement as HTMLElement)
        const suivant = e.shiftKey ? (i <= 0 ? focalisables.length - 1 : i - 1) : i >= focalisables.length - 1 ? 0 : i + 1
        e.preventDefault()
        focalisables[suivant].focus({ preventScroll: true })
      }
      document.addEventListener('keydown', auClavier)
      return () => {
        document.removeEventListener('keydown', auClavier)
        if (main) main.inert = false
        getLenis()?.start()
        document.querySelector<HTMLElement>('[data-menu-bouton]')?.focus({ preventScroll: true })
      }
    }

    // Fermeture (sauf au premier rendu, où rien n'est ouvert).
    if (premierRendu.current) {
      premierRendu.current = false
      el.hidden = true
      bg.hidden = true
      return
    }
    gsap.to(couches, {
      ...(reduit ? { opacity: 0, duration: 0.2 } : { '--bas': '100%', duration: 0.5, ease: EASE_UI }),
      onComplete: () => {
        el.hidden = true
        bg.hidden = true
        hero.sale = true
      },
    })
  }, [ouvert])

  const auClicFond = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setMenuOuvert(false)
  }
  const auLien = (href: string, label: string) => {
    setMenuOuvert(false)
    naviguer({ href, type: 'rideau', label })
  }

  return (
    <>
    <div ref={fond} className={styles.fond} aria-hidden="true" hidden />
    <div
      ref={overlay}
      id="lc-menu"
      className={styles.menu}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-canvas={canvasPret ? 'pret' : 'absent'}
      onClick={auClicFond}
      hidden
    >
      <div className={styles.maquette} aria-hidden="true">
        <MaquetteStatique className={styles.filDeFer} />
      </div>
      <nav className={`lc-container ${styles.contenu}`} aria-label="Menu principal">
        <ul className={styles.pages}>
          {[{ label: 'Accueil', href: '' }, ...site.nav].map((item) => (
            <li key={item.href} data-menu-item>
              <LienTransition
                href={`${site.base}${item.href}`}
                label={item.label}
                className={`lc-display ${styles.page}`}
                onClick={(e) => {
                  e.preventDefault()
                  auLien(`${site.base}${item.href}`, item.label)
                }}
              >
                {item.label}
              </LienTransition>
            </li>
          ))}
        </ul>
        <ol className={styles.projets}>
          {projets.map((p, i) => (
            <li key={p.slug} data-menu-item>
              <LienTransition
                href={`${site.base}/projets/${p.slug}`}
                label={p.titre}
                className={`lc-mono ${styles.projet}`}
                onClick={(e) => {
                  e.preventDefault()
                  auLien(`${site.base}/projets/${p.slug}`, p.titre)
                }}
              >
                <span className={styles.numero}>{formatNumero(i)}</span> {p.titre}
              </LienTransition>
            </li>
          ))}
        </ol>
      </nav>
    </div>
    </>
  )
}
