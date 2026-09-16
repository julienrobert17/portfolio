'use client'

import { advance } from '@react-three/fiber'
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
import { onTick } from '../lib/ticker'
import GardeCanvas from './garde-canvas'
import styles from './canvas-host.module.css'

/**
 * Hôte du canvas, monté dans le layout : une couche fixe derrière la page.
 * Décide du mode (WebGL, mouvement réduit), charge three quand le navigateur
 * est inactif, avance la scène sur le ticker partagé seulement quand quelque
 * chose a changé, et suit le hero une fois le pin terminé.
 */
export default function CanvasHost() {
  const pathname = usePathname()
  const accueil = pathname === site.base
  const reduit = useReducedMotion()
  const mode = useSyncExternalStore(abonnerHero, lireMode, lireModeServeur)
  const pret = useSyncExternalStore(abonnerHero, lireCanvasPret, lireFaux)
  const [SceneCanvas, setSceneCanvas] = useState<ComponentType | null>(null)
  const hote = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hero.actif = accueil
    hero.sale = true
  }, [accueil])

  useEffect(() => {
    if (!accueil || SceneCanvas) return
    if (deciderModeHero(reduit) !== 'attente') return
    let annule = false
    const charger = () => {
      import('./scene-canvas')
        .then((m) => {
          if (!annule) setSceneCanvas(() => m.default)
        })
        .catch(() => setModeHero('statique'))
    }
    // requestIdleCallback avec repli setTimeout (Safari).
    const ric = typeof window.requestIdleCallback === 'function'
    const id = ric ? window.requestIdleCallback(charger, { timeout: 1500 }) : window.setTimeout(charger, 300)
    return () => {
      annule = true
      if (ric) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [accueil, reduit, SceneCanvas])

  useEffect(() => {
    if (!SceneCanvas) return
    let dernierY = 0
    return onTick((temps) => {
      if (!hero.actif) return
      const y = Math.min(0, hero.finPin - window.scrollY)
      if (y !== dernierY && hote.current) {
        hote.current.style.transform = `translate3d(0, ${y}px, 0)`
        dernierY = y
      }
      // Rendu à la demande : la scène remet `sale` à vrai tant qu'elle bouge.
      if (hero.sale) {
        hero.sale = false
        advance(temps)
      }
    })
  }, [SceneCanvas])

  if (mode === 'statique') return null

  return (
    <div ref={hote} className={styles.hote} data-pret={pret || undefined} aria-hidden="true" hidden={!accueil}>
      {SceneCanvas ? (
        <GardeCanvas>
          <SceneCanvas />
        </GardeCanvas>
      ) : null}
    </div>
  )
}
