'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { HAUTEUR_COUPE } from '../canvas/maquette'
import { COUPE_REPOS, coupeDe, origineDe } from '../lib/coupe-progression'
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
import { onTick } from '../lib/ticker'

/** Part de la coupe sur laquelle le titre s'efface (les 20 derniers %). */
const DEBUT_FONDU_TITRE = 0.8
const OPACITE_TITRE_FIN = 0.15
const SCRUB = 0.25
/** Intro : la coupe descend seule du faîtage au plancher du premier niveau. */
const DUREE_INTRO = 1.8
/** Elle attend la fin du fondu croisé SVG → 3D (600 ms en CSS). */
const ATTENTE_FONDU = 0.6
/** Progression de scroll au-delà de laquelle l'utilisateur a pris la main. */
const SEUIL_SCROLL = 0.002
/** Part de l'écart comblée à chaque frame quand la coupe rattrape le scroll. */
const RATTRAPAGE = 0.14

/**
 * Côté client du hero. Décide du mode (canvas ou repli), mesure le repère de
 * la maquette SVG pour cadrer la caméra, fait descendre la coupe (intro, puis
 * 170vh de course, 140vh au tactile, scène en position sticky, sans pin) et
 * pousse sa valeur au store : le canvas, la cote et l'opacité du titre la
 * lisent sans setState. Parallaxe souris au pointeur fin.
 */
export default function HeroScroll() {
  const ancre = useRef<HTMLSpanElement>(null)
  const reduit = useReducedMotion()
  const mode = useSyncExternalStore(abonnerHero, lireMode, lireModeServeur)
  const pret = useSyncExternalStore(abonnerHero, lireCanvasPret, lireFaux)
  const actif = mode === 'attente' || mode === 'canvas'

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

  /*
   * La coupe. Trois états : `attente` (le canvas n'a rien rendu, la coupe suit le scroll depuis le
   * faîtage), `intro` (elle descend seule jusqu'au plancher du premier niveau), `scroll` (elle suit
   * le scroll, la course restante remise à l'échelle depuis là où elle se trouve). Tout passe par
   * `coupe`, que lisent aussi la rotation, le recul et le fondu du titre.
   */
  useEffect(() => {
    if (!actif) return
    const section = ancre.current?.closest('section')
    const titre = section?.querySelector<HTMLElement>('[data-hero="titre"]')
    const cote = section?.querySelector<HTMLElement>('[data-hero="cote"]')
    if (!section || !titre || !cote) return
    const { gsap, ScrollTrigger } = registerGsap()
    const proxy = { s: 0 }
    const intro = { c: 0 }
    let etat: 'attente' | 'intro' | 'scroll' = 'attente'
    let origine = 0
    let coupe = 0
    /** Le scroll a pris de l'avance sur la coupe : elle le rejoint en douceur, sans saut. */
    let rattrapage = false
    let animation: gsap.core.Tween | null = null

    const appliquer = (c: number) => {
      coupe = c
      hero.progression = c
      hero.sale = true
      cote.textContent = formatMetres(HAUTEUR_COUPE * (1 - c))
      const fondu = Math.max(0, (c - DEBUT_FONDU_TITRE) / (1 - DEBUT_FONDU_TITRE))
      titre.style.opacity = (1 - fondu * (1 - OPACITE_TITRE_FIN)).toFixed(3)
    }
    /** Reprise par le scroll, depuis la coupe courante. */
    const reprendre = () => {
      animation?.kill()
      animation = null
      etat = 'scroll'
      origine = origineDe(coupe, proxy.s)
      rattrapage = coupeDe(origine, proxy.s) - coupe > 0.002
    }
    const suivre = () => {
      if (etat === 'intro') return
      const cible = coupeDe(origine, proxy.s)
      if (!rattrapage) appliquer(cible)
    }

    const tween = gsap.to(proxy, {
      s: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: SCRUB,
        onRefresh: (st) => {
          hero.finPin = st.end
        },
        // Le moindre scroll pendant l'intro l'annule : la coupe repart de là où elle est.
        onUpdate: (st) => {
          if (etat === 'intro' && st.progress > SEUIL_SCROLL) reprendre()
        },
      },
      onUpdate: suivre,
    })
    const declencheur = tween.scrollTrigger
    if (declencheur) hero.finPin = declencheur.end
    ScrollTrigger.refresh()

    const arretTick = onTick(() => {
      if (!rattrapage) return
      const cible = coupeDe(origine, proxy.s)
      const c = coupe + (cible - coupe) * RATTRAPAGE
      if (Math.abs(cible - c) < 0.001) {
        rattrapage = false
        appliquer(cible)
      } else appliquer(c)
    })

    const lancerIntro = () => {
      // Déjà descendu dans la page (restauration du scroll, lien profond) : pas d'intro.
      if ((declencheur?.progress ?? 0) > SEUIL_SCROLL) {
        etat = 'scroll'
        return
      }
      etat = 'intro'
      intro.c = coupe
      animation = gsap.to(intro, {
        c: COUPE_REPOS,
        duration: DUREE_INTRO,
        delay: ATTENTE_FONDU,
        ease: 'power2.out',
        onUpdate: () => appliquer(intro.c),
        onComplete: reprendre,
      })
    }

    let desabonner: (() => void) | null = null
    if (hero.canvasPret) {
      // Retour à l'accueil, canvas déjà prêt : pas d'intro, le repos est sa fin.
      appliquer(COUPE_REPOS)
      reprendre()
      suivre()
    } else {
      desabonner = abonnerHero(() => {
        if (!hero.canvasPret || etat !== 'attente') return
        desabonner?.()
        desabonner = null
        lancerIntro()
      })
    }

    return () => {
      desabonner?.()
      arretTick()
      animation?.kill()
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
  }, [actif])

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
