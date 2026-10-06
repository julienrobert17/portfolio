'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Project } from '@prisma/client'
import HeroSection from '@/components/home/hero-section'
import FeaturedProjects from '@/components/home/featured-projects'
import AboutSection from '@/components/home/about-section'
import PanelCounter from '@/components/ui/panel-counter'
import { initialEdgeGuard, noteEdges, registerDelta } from '@/lib/panel-edge-guard'
import type { EdgeGuardState, EdgeSnapshot } from '@/lib/panel-edge-guard'

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

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DURATION = '600ms'

// Butées d'un conteneur à défilement interne (2px de tolérance pour les sous-pixels)
const atTop = (el: HTMLElement) => el.scrollTop <= 2
const atBottom = (el: HTMLElement) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2
const snapshot = (el: HTMLElement): EdgeSnapshot => ({
  atTop: atTop(el),
  atBottom: atBottom(el),
  overflows: el.scrollHeight - el.clientHeight > 1,
})

type ScrollView = Exclude<View, 'hero'>

export default function ScrollController({ projects, caseStudies }: Props) {
  const [view, setView] = useState<View>('hero')
  const [isLeaving, setIsLeaving] = useState(false)
  const transitioning = useRef(false)
  const touchStartY = useRef(0)
  const lastTouchY = useRef(0)
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
  // Garde d'intention symétrique par panneau défilant (src/lib/panel-edge-guard.ts) :
  // molette et swipe ne basculent qu'après un geste franc depuis la butée, pas sur l'inertie.
  const guards = useRef<Record<ScrollView, EdgeGuardState>>({ projects: initialEdgeGuard, about: initialEdgeGuard })

  useEffect(() => { viewRef.current = view }, [view])

  const goTo = useCallback((next: View) => {
    if (transitioning.current || next === viewRef.current) return
    transitioning.current = true

    // Le panneau d'arrivée est en haut quand on avance, en bas quand on recule
    const forward = ORDER.indexOf(next) > ORDER.indexOf(viewRef.current)
    const show = () => {
      const el = scrollContainer(next)
      if (el && next !== 'hero') {
        el.scrollTop = forward ? 0 : el.scrollHeight
        // Déjà en butée à l'affichage : l'instant d'arrivée est celui de l'affichage
        guards.current[next] = noteEdges(initialEdgeGuard, snapshot(el), performance.now())
      }
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
    const panels: ScrollView[] = ['projects', 'about']
    // Arrivées et départs de butée, au scroll de chaque conteneur
    const noteEdgesOf = (panel: ScrollView) => {
      const el = scrollContainer(panel)
      if (el) guards.current[panel] = noteEdges(guards.current[panel], snapshot(el), performance.now())
    }
    const scrollHandlers = panels.map((panel) => [panel, () => noteEdgesOf(panel)] as const)

    // Un delta de molette ou de swipe (positif vers le bas) sur le panneau courant
    const handleDelta = (delta: number, now: number) => {
      const current = viewRef.current
      if (current === 'hero') {
        if (delta > 0) goTo('projects')
        return
      }
      const el = scrollContainer(current)
      if (!el) return
      const result = registerDelta(guards.current[current], snapshot(el), delta, now)
      guards.current[current] = result.state
      if (result.flip) step(delta > 0 ? 1 : -1)
    }

    const onWheel = (e: WheelEvent) => handleDelta(e.deltaY, performance.now())

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      lastTouchY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      if (viewRef.current === 'hero') {
        if (touchStartY.current - y > 30) goTo('projects')
        return
      }
      handleDelta(lastTouchY.current - y, performance.now())
      lastTouchY.current = y
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
    scrollHandlers.forEach(([panel, handler]) => scrollContainer(panel)?.addEventListener('scroll', handler, { passive: true }))

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKeyDown)
      scrollHandlers.forEach(([panel, handler]) => scrollContainer(panel)?.removeEventListener('scroll', handler))
    }
  }, [step, goTo, scrollContainer])

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
