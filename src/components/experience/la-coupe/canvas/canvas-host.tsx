'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { site } from '../content/site'
import {
  abonnerHero,
  deciderModeHero,
  hero,
  lireCanvasPret,
  lireFaux,
  lireMode,
  lireModeServeur,
  setModeHero,
} from '../lib/hero-store'
import { abonnerMenu, lireMenu, lireMenuServeur } from '../lib/navigation-store'
import { onTick } from '../lib/ticker'
import GardeCanvas from './garde-canvas'
import styles from './canvas-host.module.css'

/** Hors accueil, three attend `load` plus ce délai, faute d'intention d'ouvrir le menu. */
const RETARD_THREE = 3000

/**
 * Hôte du canvas, monté dans le layout : une couche fixe derrière la page.
 * Décide du mode (WebGL, mouvement réduit), charge three (voir plus bas),
 * avance la scène sur le ticker partagé seulement quand quelque chose a
 * changé, et suit le hero une fois le pin terminé.
 */
export default function CanvasHost() {
  const pathname = usePathname()
  const accueil = pathname === site.base
  const reduit = useReducedMotion()
  const mode = useSyncExternalStore(abonnerHero, lireMode, lireModeServeur)
  const pret = useSyncExternalStore(abonnerHero, lireCanvasPret, lireFaux)
  const menu = useSyncExternalStore(abonnerMenu, lireMenu, lireMenuServeur)
  const [SceneCanvas, setSceneCanvas] = useState<ComponentType | null>(null)
  /** advance() de fiber, récupéré avec le module dynamique : rien de three dans le JS initial. */
  const avancer = useRef<((temps: number) => void) | null>(null)
  const hote = useRef<HTMLDivElement>(null)

  // Actif à l'accueil (coupe) et menu ouvert (fil de fer), sur toutes les pages.
  useEffect(() => {
    hero.actif = accueil || menu
    hero.sale = true
  }, [accueil, menu])

  /*
   * Chargement de three (235 kB). À l'accueil, la maquette EST la page : dès l'inactivité.
   * Ailleurs elle ne sert qu'au fond du menu, et son téléchargement volait de la bande passante
   * à l'image de tête des fiches ; il attend donc le plus tôt de deux signaux : l'intention
   * d'ouvrir le menu (survol ou focus du bouton, toucher posé dessus), ou `load` plus trois
   * secondes. Le menu s'ouvre sans elle et la fait apparaître en fondu quand elle arrive.
   */
  useEffect(() => {
    if (SceneCanvas) return
    if (deciderModeHero() !== 'attente') return
    let annule = false
    let lance = false
    const charger = () => {
      if (annule || lance) return
      lance = true
      import('./scene-canvas')
        .then((m) => {
          if (annule) return
          avancer.current = m.advance
          setSceneCanvas(() => m.default)
        })
        .catch(() => setModeHero('statique'))
    }

    // Accueil : à l'inactivité, comme avant. requestIdleCallback avec repli setTimeout (Safari).
    if (accueil) {
      const ric = typeof window.requestIdleCallback === 'function'
      const id = ric ? window.requestIdleCallback(charger, { timeout: 1500 }) : window.setTimeout(charger, 300)
      return () => {
        annule = true
        if (ric) window.cancelIdleCallback(id)
        else window.clearTimeout(id)
      }
    }

    // Ailleurs : l'intention d'ouvrir le menu, ou `load` plus trois secondes, au plus tôt.
    let retard = 0
    const auSignal = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('[data-menu-bouton]')) charger()
    }
    const armerRetard = () => {
      retard = window.setTimeout(charger, RETARD_THREE)
    }
    const TYPES = ['pointerover', 'focusin', 'pointerdown'] as const
    // `load` est peut-être déjà passé (navigation client) : on compte alors depuis maintenant.
    if (document.readyState === 'complete') armerRetard()
    else window.addEventListener('load', armerRetard, { once: true })
    for (const type of TYPES) document.addEventListener(type, auSignal, { passive: true, capture: true })

    return () => {
      annule = true
      window.clearTimeout(retard)
      window.removeEventListener('load', armerRetard)
      for (const type of TYPES) document.removeEventListener(type, auSignal, { capture: true })
    }
  }, [reduit, SceneCanvas, accueil])

  useEffect(() => {
    if (!SceneCanvas) return
    let dernierY = 0
    return onTick((temps) => {
      if (!hero.actif) return
      const y = menu ? 0 : Math.min(0, hero.finPin - window.scrollY)
      if (y !== dernierY && hote.current) {
        hote.current.style.transform = `translate3d(0, ${y}px, 0)`
        dernierY = y
      }
      // Rendu à la demande : la scène remet `sale` à vrai tant qu'elle bouge.
      if (hero.sale && avancer.current) {
        hero.sale = false
        avancer.current(temps)
      }
    })
  }, [SceneCanvas, menu])

  if (mode === 'statique') return null

  return (
    <div
      ref={hote}
      className={styles.hote}
      data-pret={pret || undefined}
      data-menu={menu || undefined}
      data-visible={accueil || menu}
      aria-hidden="true"
    >
      {SceneCanvas ? (
        <GardeCanvas>
          <SceneCanvas />
        </GardeCanvas>
      ) : null}
    </div>
  )
}
