'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/* --------------------------------------------------------------------------
 * Constantes physiques
 * ----------------------------------------------------------------------- */

/** Rayon de déclenchement du champ de répulsion (px). */
const RADIUS = 110
/** Hystérésis : on ne « ressort » du champ qu'au-delà de 1.35× le rayon. */
const EXIT_FACTOR = 1.35
/** Intensité de la répulsion souris (N·px⁻¹ arbitraires, ∝ (1 - d/R)). */
const REPULSION = 22000
/** Ressort de rappel vers l'offset (0,0). */
const STIFFNESS = 170
/** Amortissement visqueux (sous-amorti : c_crit = 2·√k ≈ 26). */
const DAMPING = 18
/** Masse du bouton. */
const MASS = 1
/** Marge minimale conservée sur chaque bord du viewport (px). */
const MARGIN = 12
/** Amplitude du saut tactile : 150 → 220 px. */
const TAP_JUMP_MIN = 150
const TAP_JUMP_SPAN = 70
/** Saut instantané utilisé en reduced-motion pour la souris. */
const REDUCED_JUMP = 170
/** Seuils de repos : sous ça, la boucle rAF s'arrête. */
const EPS_POS = 0.05
const EPS_VEL = 0.01
/** Pas d'intégration maximal (évite l'explosion après un onglet en veille). */
const MAX_DT = 1 / 30

/* --------------------------------------------------------------------------
 * Types publics
 * ----------------------------------------------------------------------- */

export interface UseDodgeOptions {
  /** Nombre d'esquives après lequel le bouton se pose et devient cliquable. */
  maxDodges: number
  /** Si vrai : pas de spring, décalage instantané, et pas de boucle rAF. */
  reducedMotion: boolean
  /** Appelé à chaque esquive, avec le nouveau compte (1-indexé). */
  onDodge?: (count: number) => void
}

export interface UseDodgeResult {
  /** À poser sur le bouton lui-même. Le hook écrit son transform directement. */
  buttonRef: RefObject<HTMLButtonElement | null>
  /** À poser sur un conteneur qui entoure largement le bouton (zone tactile élargie). */
  zoneRef: RefObject<HTMLDivElement | null>
  /** Nombre d'esquives déjà effectuées. */
  dodges: number
  /** true quand dodges >= maxDodges : le bouton ne fuit plus, il est pleinement cliquable. */
  settled: boolean
  /** Remet à zéro (utilisé par « Recommencer »). */
  reset: () => void
}

/** Rect « au repos » du bouton, transform retiré, en coordonnées viewport. */
interface BaseRect {
  left: number
  top: number
  width: number
  height: number
}

interface Vec {
  x: number
  y: number
}

/* --------------------------------------------------------------------------
 * Hook
 * ----------------------------------------------------------------------- */

export function useDodge(options: UseDodgeOptions): UseDodgeResult {
  const { maxDodges, reducedMotion, onDodge } = options

  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const zoneRef = useRef<HTMLDivElement | null>(null)

  // Seul état remonté au rendu : le compteur. `settled` en est dérivé.
  const [dodges, setDodges] = useState(0)
  const settled = dodges >= maxDodges

  // Miroirs en refs : les listeners ne se rebranchent pas à chaque rendu.
  const dodgesRef = useRef(0)
  const maxDodgesRef = useRef(maxDodges)
  const onDodgeRef = useRef<((count: number) => void) | undefined>(onDodge)

  // État physique.
  const offsetRef = useRef<Vec>({ x: 0, y: 0 })
  const velRef = useRef<Vec>({ x: 0, y: 0 })
  const baseRef = useRef<BaseRect | null>(null)
  const pointerRef = useRef<Vec | null>(null)
  const insideRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)

  // Synchro des options (écriture de ref, jamais de setState ici).
  useEffect(() => {
    maxDodgesRef.current = maxDodges
    onDodgeRef.current = onDodge
  }, [maxDodges, onDodge])

  /* ---------------------------------------------------------------- outils */

  /** Mesure le rect de base : rect courant moins l'offset appliqué. */
  const measure = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    baseRef.current = {
      left: r.left - offsetRef.current.x,
      top: r.top - offsetRef.current.y,
      width: r.width,
      height: r.height,
    }
  }, [])

  /** Borne l'offset pour garder le bouton entièrement visible (marge 12px). */
  const clamp = useCallback((v: Vec): Vec => {
    const base = baseRef.current
    if (!base) return v
    const minX = MARGIN - base.left
    const maxX = window.innerWidth - MARGIN - (base.left + base.width)
    const minY = MARGIN - base.top
    const maxY = window.innerHeight - MARGIN - (base.top + base.height)
    return {
      x: minX > maxX ? 0 : Math.min(Math.max(v.x, minX), maxX),
      y: minY > maxY ? 0 : Math.min(Math.max(v.y, minY), maxY),
    }
  }, [])

  /** Écrit la position dans le DOM sans repasser par le rendu React. */
  const paint = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const { x, y } = offsetRef.current
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
  }, [])

  /** Force de répulsion issue de la dernière position connue du curseur. */
  const repulsion = useCallback((): Vec => {
    const base = baseRef.current
    const p = pointerRef.current
    if (!base || !p) return { x: 0, y: 0 }
    if (dodgesRef.current >= maxDodgesRef.current) return { x: 0, y: 0 }
    const cx = base.left + base.width / 2 + offsetRef.current.x
    const cy = base.top + base.height / 2 + offsetRef.current.y
    let dx = cx - p.x
    let dy = cy - p.y
    const d = Math.hypot(dx, dy)
    if (d > RADIUS) return { x: 0, y: 0 }
    // Curseur pile au centre : direction aléatoire plutôt qu'une division par 0.
    if (d < 0.001) {
      const a = Math.random() * Math.PI * 2
      dx = Math.cos(a)
      dy = Math.sin(a)
    } else {
      dx /= d
      dy /= d
    }
    const strength = REPULSION * (1 - d / RADIUS)
    return { x: dx * strength, y: dy * strength }
  }, [])

  /* ------------------------------------------------------------ boucle rAF */

  // Indirection par ref : la boucle se replanifie sans se référencer elle-même.
  const stepRef = useRef<(time: number) => void>(() => {})
  const tick = useCallback((time: number) => stepRef.current(time), [])

  const step = useCallback(
    (time: number) => {
      rafRef.current = null
      const dt = Math.min((time - lastTimeRef.current) / 1000, MAX_DT)
      lastTimeRef.current = time
      if (dt <= 0) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const f = repulsion()
      const pos = offsetRef.current
      const vel = velRef.current

      // Ressort amorti vers (0,0) + répulsion : a = (-k·x - c·v + F) / m
      const ax = (-STIFFNESS * pos.x - DAMPING * vel.x + f.x) / MASS
      const ay = (-STIFFNESS * pos.y - DAMPING * vel.y + f.y) / MASS
      const nvx = vel.x + ax * dt
      const nvy = vel.y + ay * dt
      velRef.current = { x: nvx, y: nvy }
      offsetRef.current = clamp({ x: pos.x + nvx * dt, y: pos.y + nvy * dt })
      paint()

      // Repos : plus de force, plus de vitesse, plus de déplacement.
      const atRest =
        Math.hypot(f.x, f.y) < 1 &&
        Math.hypot(nvx, nvy) < EPS_VEL &&
        Math.hypot(offsetRef.current.x, offsetRef.current.y) < EPS_POS
      if (atRest) {
        offsetRef.current = { x: 0, y: 0 }
        velRef.current = { x: 0, y: 0 }
        paint()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [clamp, paint, repulsion, tick],
  )

  useEffect(() => {
    stepRef.current = step
  }, [step])

  /** Relance la boucle si elle dort (jamais de rAF qui tourne dans le vide). */
  const kick = useCallback(() => {
    if (rafRef.current !== null) return
    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  /* ---------------------------------------------------------- comptage */

  /** Incrémente le compteur — appelé depuis un gestionnaire d'événement. */
  const bump = useCallback(() => {
    const next = dodgesRef.current + 1
    dodgesRef.current = next
    setDodges(next)
    onDodgeRef.current?.(next)
  }, [])

  /* ---------------------------------------------------- écoute des pointeurs */

  useEffect(() => {
    const el = buttonRef.current
    const zone = zoneRef.current
    if (!el) return

    measure()
    paint()

    const onMeasure = () => measure()

    // --- Souris : champ de répulsion continu -------------------------------
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pointerRef.current = { x: e.clientX, y: e.clientY }
      const base = baseRef.current
      if (!base) return
      if (dodgesRef.current >= maxDodgesRef.current) {
        insideRef.current = false
        return
      }

      const cx = base.left + base.width / 2 + offsetRef.current.x
      const cy = base.top + base.height / 2 + offsetRef.current.y
      const d = Math.hypot(cx - e.clientX, cy - e.clientY)

      let entered = false
      if (!insideRef.current && d < RADIUS) {
        insideRef.current = true
        entered = true
      } else if (insideRef.current && d > RADIUS * EXIT_FACTOR) {
        insideRef.current = false
      }

      if (reducedMotion) {
        // Pas de ressort : saut sec, uniquement au front montant.
        if (entered) {
          let dx = cx - e.clientX
          let dy = cy - e.clientY
          const n = Math.hypot(dx, dy)
          if (n < 0.001) {
            const a = Math.random() * Math.PI * 2
            dx = Math.cos(a)
            dy = Math.sin(a)
          } else {
            dx /= n
            dy /= n
          }
          offsetRef.current = clamp({
            x: offsetRef.current.x + dx * REDUCED_JUMP,
            y: offsetRef.current.y + dy * REDUCED_JUMP,
          })
          paint()
        }
      } else if (d < RADIUS * EXIT_FACTOR) {
        kick()
      }

      if (entered) bump()
    }

    // --- Tactile / stylet : esquive sèche avant que le tap n'active ---------
    const onPointerDownCapture = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
      if (dodgesRef.current >= maxDodgesRef.current) return
      const base = baseRef.current
      if (!base) return

      e.preventDefault() // neutralise le clic qui suivrait

      const cx = base.left + base.width / 2 + offsetRef.current.x
      const cy = base.top + base.height / 2 + offsetRef.current.y
      let dx = cx - e.clientX
      let dy = cy - e.clientY
      const n = Math.hypot(dx, dy)
      if (n < 0.001) {
        const a = Math.random() * Math.PI * 2
        dx = Math.cos(a)
        dy = Math.sin(a)
      } else {
        dx /= n
        dy /= n
      }
      const amp = TAP_JUMP_MIN + Math.random() * TAP_JUMP_SPAN
      offsetRef.current = clamp({
        x: offsetRef.current.x + dx * amp,
        y: offsetRef.current.y + dy * amp,
      })
      velRef.current = { x: 0, y: 0 }
      paint()
      if (!reducedMotion) kick() // le ressort ramènera doucement vers (0,0)
      bump()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('resize', onMeasure, { passive: true })
    window.addEventListener('scroll', onMeasure, { passive: true })
    // Capture + non passif : indispensable pour preventDefault sur le tap.
    zone?.addEventListener('pointerdown', onPointerDownCapture, { capture: true })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onMeasure)
      window.removeEventListener('scroll', onMeasure)
      zone?.removeEventListener('pointerdown', onPointerDownCapture, { capture: true })
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [bump, clamp, kick, measure, paint, reducedMotion])

  /* ------------------------------------------- retour au repos une fois posé */

  useEffect(() => {
    if (!settled) return
    insideRef.current = false
    if (reducedMotion) {
      // Retour instantané.
      offsetRef.current = { x: 0, y: 0 }
      velRef.current = { x: 0, y: 0 }
      paint()
      return
    }
    kick() // le ressort ramène le bouton à (0,0), sans répulsion résiduelle
  }, [settled, reducedMotion, kick, paint])

  /* ------------------------------------------------------------------ reset */

  const reset = useCallback(() => {
    dodgesRef.current = 0
    insideRef.current = false
    offsetRef.current = { x: 0, y: 0 }
    velRef.current = { x: 0, y: 0 }
    pointerRef.current = null
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    paint()
    setDodges(0)
  }, [paint])

  return { buttonRef, zoneRef, dodges, settled, reset }
}
