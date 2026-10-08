'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import type { Project } from '@prisma/client'
import HeroSection from '@/components/home/hero-section'
import FeaturedProjects from '@/components/home/featured-projects'
import AboutSection from '@/components/home/about-section'
import PanelCounter from '@/components/ui/panel-counter'
import { beginGesture, enterPanel, initialEdgeGuard, noteEdges, registerDelta, trackDelta } from '@/lib/panel-edge-guard'
import type { DeltaSource, EdgeGuardState, EdgeSnapshot } from '@/lib/panel-edge-guard'

type View = 'hero' | 'projects' | 'about'

const ORDER: View[] = ['hero', 'projects', 'about']

// La home n'est pas scrollable : les ancres de la nav sont traduites en bascule de panneau.
const HASH_TO_VIEW: Record<string, View> = {
  '#realisations': 'projects',
  '#a-propos': 'about',
}
// Et inversement : l'URL suit le panneau courant, un rechargement rouvre le même
const VIEW_TO_HASH: Record<View, string> = { hero: '', projects: '#realisations', about: '#a-propos' }

interface Props {
  projects: Project[]
  caseStudies: string[]
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DURATION = '600ms'

// Hash de l'URL au premier rendu client (null côté serveur) : un lien profond
// vers un panneau s'ouvre directement dessus, sans rejouer le hero.
const subscribeNoop = () => () => {}
const readHash = () => window.location.hash

/**
 * Le défilement natif vers une ancre (chargement avec hash, navigation Next)
 * décale les conteneurs en overflow: hidden de quelques pixels, et rien ne les
 * ramène. On remet à zéro tout ce qui entoure les panneaux.
 */
function resetStrayScroll(root: HTMLElement | null) {
  if (!root) return
  for (const child of Array.from(root.children)) (child as HTMLElement).scrollTop = 0
  for (let el: HTMLElement | null = root; el; el = el.parentElement) el.scrollTop = 0
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0
}

// Butées d'un conteneur à défilement interne (2px de tolérance pour les sous-pixels)
const atTop = (el: HTMLElement) => el.scrollTop <= 2
const atBottom = (el: HTMLElement) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2
const snapshot = (el: HTMLElement): EdgeSnapshot => ({ atTop: atTop(el), atBottom: atBottom(el) })

type ScrollView = Exclude<View, 'hero'>

export default function ScrollController({ projects, caseStudies }: Props) {
  const [view, setView] = useState<View>('hero')
  const [isLeaving, setIsLeaving] = useState(false)
  // Transitions actives seulement après une première navigation : un lien profond s'affiche d'un coup
  const [navigated, setNavigated] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const initialHash = useSyncExternalStore(subscribeNoop, readHash, () => null)
  const [hashApplied, setHashApplied] = useState(false)
  if (initialHash !== null && !hashApplied) {
    setHashApplied(true)
    const target = HASH_TO_VIEW[initialHash]
    if (target) setView(target)
  }
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
  // Garde d'intention sur les butées (src/lib/panel-edge-guard.ts) : le geste qui amène en
  // butée est ignoré, seul un nouveau geste bascule. Un seul état : le suivi du geste est
  // celui du flux d'entrée, il survit au changement de panneau.
  const guard = useRef<EdgeGuardState>(initialEdgeGuard)

  useEffect(() => { viewRef.current = view }, [view])

  const goTo = useCallback((next: View) => {
    if (transitioning.current || next === viewRef.current) return
    transitioning.current = true
    setNavigated(true)

    // Le panneau d'arrivée est en haut quand on avance, en bas quand on recule
    const forward = ORDER.indexOf(next) > ORDER.indexOf(viewRef.current)
    const show = () => {
      const el = scrollContainer(next)
      if (el && next !== 'hero') {
        el.scrollTop = forward ? 0 : el.scrollHeight
        // Déjà en butée à l'affichage : verrou posé, le geste en cours ne basculera pas
        guard.current = enterPanel(guard.current, snapshot(el))
      }
      setView(next)
      resetStrayScroll(rootRef.current)
      // replaceState : pas d'entrée d'historique, pas de défilement, pas d'événement hashchange
      const hash = VIEW_TO_HASH[next]
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + hash)
      }
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
    // Après le défilement natif vers l'ancre du chargement ou de la navigation Next
    resetStrayScroll(rootRef.current)
    const frame = requestAnimationFrame(() => resetStrayScroll(rootRef.current))
    // Et à tout défilement parasite ultérieur (hash tapé à la main, focus) : seuls les
    // conteneurs internes des panneaux ont le droit de défiler.
    const root = rootRef.current
    const guarded = new Set<EventTarget>()
    if (root) {
      guarded.add(document)
      for (let el: HTMLElement | null = root; el; el = el.parentElement) guarded.add(el)
      for (const child of Array.from(root.children)) guarded.add(child)
    }
    const onStrayScroll = (e: Event) => {
      if (e.target && guarded.has(e.target)) resetStrayScroll(root)
    }
    document.addEventListener('scroll', onStrayScroll, { capture: true, passive: true })
    return () => {
      document.documentElement.style.overflow = ''
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', onStrayScroll, { capture: true })
    }
  }, [])

  useEffect(() => {
    const onHash = () => {
      const target = HASH_TO_VIEW[window.location.hash]
      if (target && target !== viewRef.current) goTo(target)
    }
    // Pas d'appel initial : le hash du chargement est appliqué pendant le rendu (initialHash), sans transition
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [goTo])

  useEffect(() => {
    const panels: ScrollView[] = ['projects', 'about']
    // Arrivées et départs de butée, au scroll du conteneur courant
    const noteEdgesOf = (panel: ScrollView) => {
      const el = scrollContainer(panel)
      if (el && viewRef.current === panel) guard.current = noteEdges(guard.current, snapshot(el))
    }
    const scrollHandlers = panels.map((panel) => [panel, () => noteEdgesOf(panel)] as const)

    // Un delta de molette ou de swipe (positif vers le bas) sur le panneau courant
    const handleDelta = (delta: number, now: number, source: DeltaSource) => {
      const current = viewRef.current
      if (current === 'hero') {
        // Pas de défilement sur le hero : on suit le geste pour que le panneau suivant le connaisse
        guard.current = trackDelta(guard.current, delta, now)
        if (delta > 0) goTo('projects')
        return
      }
      const el = scrollContainer(current)
      if (!el) return
      const result = registerDelta(guard.current, snapshot(el), delta, now, source)
      guard.current = result.state
      if (result.flip) step(delta > 0 ? 1 : -1)
    }

    const onWheel = (e: WheelEvent) => handleDelta(e.deltaY, performance.now(), 'wheel')

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      lastTouchY.current = e.touches[0].clientY
      // Un toucher est toujours un nouveau geste
      guard.current = beginGesture(guard.current)
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      if (viewRef.current === 'hero') {
        if (touchStartY.current - y > 30) goTo('projects')
        return
      }
      handleDelta(lastTouchY.current - y, performance.now(), 'touch')
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
      transition: navigated ? `opacity ${DURATION} ${EASE}, transform ${DURATION} ${EASE}` : 'none',
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0)' : `translateY(${above ? -40 : 40}px)`,
      transitionDelay: active ? '300ms' : '0ms',
      pointerEvents: active ? 'auto' : 'none',
    }
  }

  const scrollStyle: CSSProperties = { height: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
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
