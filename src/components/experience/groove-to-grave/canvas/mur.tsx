'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { moteur } from '../audio/moteur'
import { onTick } from '../lib/ticker'
import { useLecteur } from '../store/lecteur-store'
import { couleurs } from '../tokens'

/** Chargé après le LCP, pendant un temps libre du navigateur. */
const RETARD_SANS_IDLE = 600

/**
 * Le mur : un seul canvas WebGL2 plein écran derrière le contenu, un quad et un fragment
 * shader (canvas/mur-shader.ts). Rendu une fois à l'arrivée et au redimensionnement, puis sur le
 * ticker seulement pendant la lecture : la respiration suit l'énergie des graves, le
 * tremblement les attaques de grosse caisse, 3 px au plus ; immobile quand rien ne joue. DPR
 * plafonné à 1,5 (1 sur mobile), pause quand l'onglet est caché. Sans WebGL2 ou contexte
 * perdu : la texture AVIF statique du CSS reste seule (le canvas disparaît).
 */
export default function Mur() {
  const { statut } = useLecteur()
  const reduit = useReducedMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const rendu = useRef<((l: number, h: number, e: number, t: number, g: number, c: number) => void) | null>(null)
  const [mode, setMode] = useState<'attente' | 'canvas' | 'statique'>('attente')
  const joue = statut === 'lecture'

  // Chargement différé du shader, après le premier rendu, à l'inactivité.
  useEffect(() => {
    let annule = false
    const charger = async () => {
      const el = canvas.current
      if (!el || annule) return
      const gl = el.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' })
      if (!gl) {
        setMode('statique')
        return
      }
      const { creerMur } = await import('./mur-shader')
      if (annule) return
      const fn = creerMur(gl, couleurs)
      if (!fn) {
        setMode('statique')
        return
      }
      rendu.current = fn
      el.addEventListener('webglcontextlost', (e) => {
        e.preventDefault()
        rendu.current = null
        setMode('statique')
      }, { once: true })
      setMode('canvas')
    }
    const ric = typeof window.requestIdleCallback === 'function'
    const id = ric ? window.requestIdleCallback(() => void charger(), { timeout: 2000 }) : window.setTimeout(() => void charger(), RETARD_SANS_IDLE)
    return () => {
      annule = true
      if (ric) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])

  // Taille et rendu à la demande ; animation sur le ticker seulement en lecture et hors mouvement réduit.
  useEffect(() => {
    if (mode !== 'canvas') return
    const el = canvas.current
    const fn = rendu.current
    if (!el || !fn) return
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const echelle = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5)
    let temps = 0
    let coup = 0
    let gravesLisses = 0
    let dernierGraves = 0
    const dessiner = () => fn(el.width, el.height, echelle, temps, gravesLisses, coup)
    const redimensionner = () => {
      el.width = Math.round(window.innerWidth * echelle)
      el.height = Math.round(window.innerHeight * echelle)
      dessiner()
    }
    redimensionner()
    window.addEventListener('resize', redimensionner)
    let off: (() => void) | null = null
    if (joue && !reduit) {
      off = onTick((_, delta) => {
        if (document.visibilityState === 'hidden') return
        const dt = Math.min(0.05, delta / 1000)
        temps += dt
        const g = moteur().graves()
        // Attaque : montée nette de l'énergie des graves, puis décroissance en 250 ms.
        if (g - dernierGraves > 0.18) coup = 1
        dernierGraves = g
        coup = Math.max(0, coup - dt / 0.25)
        gravesLisses += (g - gravesLisses) * Math.min(1, dt * 12)
        dessiner()
      })
    } else {
      // À l'arrêt : une dernière image au repos, immobile.
      gravesLisses = 0
      coup = 0
      dessiner()
    }
    return () => {
      window.removeEventListener('resize', redimensionner)
      off?.()
    }
  }, [mode, joue, reduit])

  if (mode === 'statique') return null
  return <canvas ref={canvas} className="g2g-mur-canvas" aria-hidden="true" data-pret={mode === 'canvas' || undefined} />
}
