'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { abonnerHero, hero, lireCanvasPret, lireFaux, lireMode, lireModeServeur } from '../lib/hero-store'

/**
 * Côté client du hero : mesure le repère de la maquette SVG pour cadrer la
 * caméra, et reflète l'état du canvas sur la section (fondu croisé).
 * Le pin, la cote et la parallaxe arrivent aux étapes suivantes.
 */
export default function HeroScroll() {
  const ancre = useRef<HTMLSpanElement>(null)
  const mode = useSyncExternalStore(abonnerHero, lireMode, lireModeServeur)
  const pret = useSyncExternalStore(abonnerHero, lireCanvasPret, lireFaux)

  useEffect(() => {
    const section = ancre.current?.closest('section')
    const maquette = section?.querySelector<HTMLElement>('[data-hero="maquette"]')
    if (!section || !maquette) return
    const mesurer = () => {
      const rs = maquette.getBoundingClientRect()
      const rh = section.getBoundingClientRect()
      hero.cadre = { cx: rs.left + rs.width / 2, cy: rs.top - rh.top + rs.height / 2, largeur: rs.width }
      hero.sale = true
    }
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(section)
    return () => observateur.disconnect()
  }, [])

  useEffect(() => {
    const section = ancre.current?.closest('section')
    if (!section) return
    section.dataset.mode = mode
    section.dataset.canvas = pret ? 'pret' : 'absent'
  }, [mode, pret])

  return <span ref={ancre} hidden />
}
