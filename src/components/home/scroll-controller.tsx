'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Project } from '@prisma/client'
import HeroSection from '@/components/home/hero-section'
import FeaturedProjects from '@/components/home/featured-projects'
import AboutSection from '@/components/home/about-section'
import PanelCounter from '@/components/ui/panel-counter'

type View = 'hero' | 'projects' | 'about'

const ORDER: View[] = ['hero', 'projects', 'about']

// La home n'est pas scrollable : les ancres de la nav sont traduites en bascule de panneau.
const HASH_TO_VIEW: Record<string, View> = {
  '#realisations': 'projects',
  '#a-propos': 'about',
}

interface Props {
  projects: Project[]
  caseStudies: string[]
}

/** Après l'arrivée en haut de la grille, les gestes vers le haut sont ignorés pendant ce délai (inertie trackpad). */
const GARDE_HAUT_MS = 400
/** Puis il faut ce cumul, sur un geste neuf, pour revenir au hero. */
const CUMUL_RETOUR_PX = 80
/** Deux événements molette séparés de plus que ça appartiennent à deux gestes. */
const PAUSE_GESTE_MS = 150

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DURATION = '600ms'

// Butées d'un conteneur à défilement interne (2px de tolérance pour les sous-pixels)
const atTop = (el: HTMLElement) => el.scrollTop <= 2
const atBottom = (el: HTMLElement) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2

export default function ScrollController({ projects, caseStudies }: Props) {
  const [view, setView] = useState<View>('hero')
  const [isLeaving, setIsLeaving] = useState(false)
  const transitioning = useRef(false)
  const touchStartY = useRef(0)
  const viewRef = useRef<View>('hero')
  // Les panneaux réalisations et À propos défilent en interne : on ne change
  // de panneau que lorsque leur conteneur est en butée dans le sens demandé.
  const projectsScrollRef = useRef<HTMLDivElement>(null)
  const aboutScrollRef = useRef<HTMLDivElement>(null)
  const scrollContainer = useCallback((panel: View): HTMLDivElement | null => {
    if (panel === 'projects') return projectsScrollRef.current
    if (panel === 'about') return aboutScrollRef.current
    return null
  }, [])
  /*
   * Retour au hero depuis une grille qui déborde : en plus de la butée haute,
   * il faut un geste intentionnel (voir `retourVersHero`), pas l'élan du geste
   * qui a ramené la grille en haut. Quand la grille tient sur un écran, la
   * butée seule suffit.
   */
  const intention = useRef({ arriveeEnHaut: 0, gesteArrivee: -1, geste: 0, dernierWheel: 0, cumul: 0, toucherDepuisHaut: false })

  useEffect(() => { viewRef.current = view }, [view])

  const goTo = useCallback((next: View) => {
    if (transitioning.current || next === viewRef.current) return
    transitioning.current = true

    // Le panneau d'arrivée est en haut quand on avance, en bas quand on recule
    const forward = ORDER.indexOf(next) > ORDER.indexOf(viewRef.current)
    const show = () => {
      const el = scrollContainer(next)
      if (el) el.scrollTop = forward ? 0 : el.scrollHeight
      setView(next)
    }

    if (viewRef.current === 'hero') {
      // Animate hero out, then switch view
      setIsLeaving(true)
      setTimeout(() => {
        show()
        setIsLeaving(false)
        setTimeout(() => { transitioning.current = false }, 600)
      }, 1000)
    } else {
      show()
      setTimeout(() => { transitioning.current = false }, 900)
    }
  }, [scrollContainer])

  const step = useCallback((direction: 1 | -1) => {
    const current = viewRef.current
    const el = scrollContainer(current)
    if (el && (direction === 1 ? !atBottom(el) : !atTop(el))) return
    const next = ORDER[ORDER.indexOf(current) + direction]
    if (next) goTo(next)
  }, [goTo, scrollContainer])

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = '' }
  }, [])

  useEffect(() => {
    const onHash = () => {
      const target = HASH_TO_VIEW[window.location.hash]
      if (target && target !== viewRef.current) goTo(target)
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [goTo])

  useEffect(() => {
    const panneau = projectsScrollRef.current
    const etat = intention.current
    const deborde = () => (panneau ? panneau.scrollHeight - panneau.clientHeight > 1 : false)
    const enHaut = () => (panneau ? atTop(panneau) : true)

    // Arrivée en haut de la grille : on note l'instant et le geste qui nous y a amenés. Appelé au
    // scroll du panneau mais aussi à chaque molette ou toucher : l'événement `scroll` n'est émis
    // qu'à la frame suivante, après les événements molette qui trouvent déjà scrollTop à 0.
    let etaitEnHaut = true
    const onPanelScroll = () => {
      const haut = enHaut()
      if (haut && !etaitEnHaut) {
        etat.arriveeEnHaut = performance.now()
        etat.gesteArrivee = etat.geste
        etat.cumul = 0
      }
      etaitEnHaut = haut
    }

    // Molette vers le haut depuis la grille : la butée haute prime (dans `step`), puis la garde
    // d'intention s'ajoute quand la grille déborde : pas sur l'élan du geste d'arrivée, et sur un cumul franc.
    const retourVersHero = (t: number, deltaY: number) => {
      if (!enHaut()) return
      if (!deborde()) {
        step(-1)
        return
      }
      if (etat.geste === etat.gesteArrivee || t - etat.arriveeEnHaut < GARDE_HAUT_MS) return
      etat.cumul += -deltaY
      if (etat.cumul >= CUMUL_RETOUR_PX) {
        etat.cumul = 0
        step(-1)
      }
    }

    const onWheel = (e: WheelEvent) => {
      const t = performance.now()
      if (t - etat.dernierWheel > PAUSE_GESTE_MS) {
        etat.geste++
        etat.cumul = 0
      }
      etat.dernierWheel = t
      onPanelScroll()
      if (e.deltaY > 0) step(1)
      else if (e.deltaY < 0) {
        if (viewRef.current === 'projects') retourVersHero(t, e.deltaY)
        else step(-1)
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      onPanelScroll()
      // Un toucher est un geste neuf ; il ne compte que s'il part du haut, garde écoulée.
      etat.toucherDepuisHaut = enHaut() && performance.now() - etat.arriveeEnHaut >= GARDE_HAUT_MS
    }

    const onTouchMove = (e: TouchEvent) => {
      const delta = touchStartY.current - e.touches[0].clientY
      if (delta > 30) step(1)
      else if (delta < -30) {
        if (viewRef.current === 'projects' && deborde()) {
          if (etat.toucherDepuisHaut && delta < -CUMUL_RETOUR_PX) step(-1)
        } else {
          step(-1)
        }
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if (e.key === 'ArrowDown' || e.key === 'PageDown') step(1)
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') step(-1)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    panneau?.addEventListener('scroll', onPanelScroll, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      panneau?.removeEventListener('scroll', onPanelScroll)
    }
  }, [step])

  // Accessibilité : la grille n'est focalisable au clavier que si elle défile.
  useEffect(() => {
    const panneau = projectsScrollRef.current
    if (!panneau) return
    const regler = () => {
      const defile = view === 'projects' && panneau.scrollHeight - panneau.clientHeight > 1
      if (defile) panneau.tabIndex = 0
      else panneau.removeAttribute('tabindex')
    }
    regler()
    window.addEventListener('resize', regler)
    return () => window.removeEventListener('resize', regler)
  }, [view])

  function panelStyle(panel: View): CSSProperties {
    const active = view === panel
    const above = ORDER.indexOf(panel) < ORDER.indexOf(view)
    return {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      transition: `opacity ${DURATION} ${EASE}, transform ${DURATION} ${EASE}`,
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0)' : `translateY(${above ? -40 : 40}px)`,
      transitionDelay: active ? '300ms' : '0ms',
      pointerEvents: active ? 'auto' : 'none',
    }
  }

  const scrollStyle: CSSProperties = { height: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <PanelCounter
        index={ORDER.indexOf(view)}
        count={ORDER.length}
        onSelect={(i) => goTo(ORDER[i])}
      />
      <div style={panelStyle('hero')}>
        <HeroSection onStart={() => goTo('projects')} isLeaving={isLeaving} />
      </div>
      <div style={{ ...panelStyle('projects'), overflow: 'hidden' }}>
        <div ref={projectsScrollRef} role="region" aria-label="Mes réalisations" style={scrollStyle}>
          <FeaturedProjects projects={projects} isActive={view === 'projects'} caseStudies={caseStudies} />
        </div>
      </div>
      <div style={{ ...panelStyle('about'), overflow: 'hidden' }}>
        <div ref={aboutScrollRef} style={scrollStyle}>
          <AboutSection />
        </div>
      </div>
    </div>
  )
}
