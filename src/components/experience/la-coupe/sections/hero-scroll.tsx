'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { HAUTEUR_COUPE, HAUTEUR_REPOS } from '../canvas/maquette'
import { COUPE_REPOS, DUREE_INTRO, courbeIntro } from '../lib/coupe-progression'
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

const CLE_INTRO = 'lc-intro-vue'
/** Durée du fondu croisé SVG → 3D (600 ms en CSS), que l'intro laisse finir. */
const ATTENTE_FONDU = 0.6

/** sessionStorage peut manquer (navigation privée stricte, stockage bloqué) : l'intro rejoue alors. */
function introDejaVue(): boolean {
  try {
    return window.sessionStorage.getItem(CLE_INTRO) === '1'
  } catch {
    return false
  }
}

function marquerIntroVue(): void {
  try {
    window.sessionStorage.setItem(CLE_INTRO, '1')
  } catch {
    // Sans stockage, la marque en mémoire (`hero.introJouee`) suffit pour la page en cours.
  }
}

/**
 * Côté client du hero. Décide du mode (canvas ou repli), mesure le repère de
 * la maquette SVG pour cadrer la caméra, joue l'intro de la coupe et pousse sa
 * valeur au store : le canvas et la cote la lisent sans setState. La section
 * tient en un écran et défile avec la page. Parallaxe souris au pointeur fin.
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

  // L'intro joue à la première arrivée sur l'accueil dans la session, quel que soit le chemin ;
  // ensuite la coupe est au repos. La marque est en sessionStorage : elle survit au rechargement.
  useEffect(() => {
    if (introDejaVue()) hero.introJouee = true
    const section = ancre.current?.closest('section')
    if (section && hero.introJouee) section.dataset.repos = ''
  }, [])

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
      if (cote) cote.textContent = formatMetres(HAUTEUR_REPOS)
    }
  }, [mode, pret])

  /*
   * La coupe descend seule, une fois par session, à la première arrivée sur l'accueil : du faîtage
   * au repos, cote comprise ; la rotation et le recul de la maquette lisent la même valeur. Le
   * scroll n'y touche pas : il fait défiler la page, l'intro continue. Ensuite, l'état de repos
   * est posé directement.
   */
  useEffect(() => {
    if (!actif) return
    const section = ancre.current?.closest('section')
    const cote = section?.querySelector<HTMLElement>('[data-hero="cote"]')
    if (!section || !cote) return
    const { gsap } = registerGsap()
    const appliquer = (c: number) => {
      hero.progression = c
      hero.sale = true
      cote.textContent = formatMetres(HAUTEUR_COUPE * (1 - c))
    }
    let animation: gsap.core.Tween | null = null
    let desabonner: (() => void) | null = null

    const jouer = () => {
      hero.introJouee = true
      marquerIntroVue()
      const intro = { c: 0 }
      animation = gsap.to(intro, {
        c: COUPE_REPOS,
        duration: DUREE_INTRO,
        // Après le fondu croisé SVG → 3D : tant qu'il dure, la scène doit coïncider avec le SVG.
        delay: ATTENTE_FONDU,
        ease: courbeIntro,
        onUpdate: () => appliquer(intro.c),
        onComplete: () => appliquer(COUPE_REPOS),
      })
    }

    if (hero.introJouee || introDejaVue()) {
      hero.introJouee = true
      section.dataset.repos = ''
      appliquer(COUPE_REPOS)
    } else if (hero.canvasPret) jouer()
    else {
      appliquer(0)
      desabonner = abonnerHero(() => {
        if (!hero.canvasPret || hero.introJouee) return
        desabonner?.()
        desabonner = null
        jouer()
      })
    }

    return () => {
      desabonner?.()
      // Départ en cours d'intro : elle ne sera pas rejouée, la coupe est posée au repos.
      animation?.kill()
      hero.progression = hero.introJouee ? COUPE_REPOS : 0
      hero.sale = true
      cote.textContent = formatMetres(HAUTEUR_COUPE)
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
