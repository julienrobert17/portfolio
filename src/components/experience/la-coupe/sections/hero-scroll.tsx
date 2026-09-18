'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { HAUTEUR_COUPE } from '../canvas/maquette'
import { formatMetres } from '../lib/format'
import { registerGsap } from '../lib/gsap'
import {
  abonnerHero,
  deciderModeHero,
  hero,
  lireCanvasPret,
  lireFaux,
  lireMode,
  lireModeServeur,
} from '../lib/hero-store'

/** Part de la progression sur laquelle le titre s'efface (les 20 derniers %). */
const DEBUT_FONDU_TITRE = 0.8
const OPACITE_TITRE_FIN = 0.15

/**
 * Côté client du hero. Décide du mode (canvas ou repli), mesure le repère de
 * la maquette SVG pour cadrer la caméra, fait défiler la coupe sur les 300vh
 * de course de la section (220vh au tactile, scène en position sticky, sans
 * pin) et pousse la progression lissée au store : le canvas, la cote
 * et l'opacité du titre la lisent sans setState. Parallaxe souris au pointeur fin.
 */
export default function HeroScroll() {
  const ancre = useRef<HTMLSpanElement>(null)
  const reduit = useReducedMotion()
  const mode = useSyncExternalStore(abonnerHero, lireMode, lireModeServeur)
  const pret = useSyncExternalStore(abonnerHero, lireCanvasPret, lireFaux)

  useEffect(() => {
    deciderModeHero()
  }, [reduit])

  // Repère de la maquette SVG, relatif au haut de la section (qui sera épinglée en haut).
  useEffect(() => {
    const section = ancre.current?.closest('section')
    const scene = section?.querySelector<HTMLElement>('[data-hero="scene"]')
    const maquette = section?.querySelector<HTMLElement>('[data-hero="maquette"]')
    if (!section || !scene || !maquette) return
    const mesurer = () => {
      const rs = maquette.getBoundingClientRect()
      const rh = scene.getBoundingClientRect()
      hero.cadre = { cx: rs.left + rs.width / 2, cy: rs.top - rh.top + rs.height / 2, largeur: rs.width }
      hero.sale = true
    }
    mesurer()
    const observateur = new ResizeObserver(mesurer)
    observateur.observe(section)
    return () => observateur.disconnect()
  }, [])

  // Reflet de l'état sur la section : fondu croisé, repli statique et sa cote fixe.
  useEffect(() => {
    const section = ancre.current?.closest('section')
    if (!section) return
    section.dataset.mode = mode
    section.dataset.canvas = pret ? 'pret' : 'absent'
    if (mode === 'statique') {
      const cote = section.querySelector<HTMLElement>('[data-hero="cote"]')
      if (cote) cote.textContent = formatMetres(HAUTEUR_COUPE / 2)
    }
  }, [mode, pret])

  // Scrub sur la course de la section : seulement quand le canvas est prévu ou monté.
  useEffect(() => {
    if (mode !== 'attente' && mode !== 'canvas') return
    const section = ancre.current?.closest('section')
    const titre = section?.querySelector<HTMLElement>('[data-hero="titre"]')
    const cote = section?.querySelector<HTMLElement>('[data-hero="cote"]')
    if (!section || !titre || !cote) return
    const { gsap, ScrollTrigger } = registerGsap()
    const proxy = { p: hero.progression }

    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4,
        onRefresh: (st) => {
          hero.finPin = st.end
        },
      },
      onUpdate: () => {
        hero.progression = proxy.p
        hero.sale = true
        cote.textContent = formatMetres(HAUTEUR_COUPE * (1 - proxy.p))
        const fondu = Math.max(0, (proxy.p - DEBUT_FONDU_TITRE) / (1 - DEBUT_FONDU_TITRE))
        titre.style.opacity = (1 - fondu * (1 - OPACITE_TITRE_FIN)).toFixed(3)
      },
    })
    const declencheur = tween.scrollTrigger
    if (declencheur) hero.finPin = declencheur.end
    ScrollTrigger.refresh()

    return () => {
      declencheur?.kill()
      tween.kill()
      hero.finPin = Infinity
      hero.progression = 0
      hero.sale = true
      titre.style.opacity = ''
      cote.textContent = formatMetres(HAUTEUR_COUPE)
      // Bascule en repli en cours de route (contexte WebGL perdu) : la section
      // perd sa course, les autres déclencheurs de la page doivent se remesurer
      // une fois le nouveau layout posé.
      if (hero.mode === 'statique') requestAnimationFrame(() => ScrollTrigger.refresh())
    }
  }, [mode])

  // Parallaxe souris ±4°, au pointeur fin seulement ; rien au gyroscope.
  useEffect(() => {
    if (mode !== 'attente' && mode !== 'canvas') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const bouger = (e: PointerEvent) => {
      hero.souris.x = (e.clientX / window.innerWidth) * 2 - 1
      hero.souris.y = (e.clientY / window.innerHeight) * 2 - 1
      hero.sale = true
    }
    window.addEventListener('pointermove', bouger, { passive: true })
    return () => {
      window.removeEventListener('pointermove', bouger)
      hero.souris.x = 0
      hero.souris.y = 0
    }
  }, [mode])

  return <span ref={ancre} hidden />
}
