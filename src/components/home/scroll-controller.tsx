'use client'

import type { CSSProperties } from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Project } from '@prisma/client'
import HeroSection from '@/components/home/hero-section'
import FeaturedProjects from '@/components/home/featured-projects'

type View = 'hero' | 'projects'

interface Props {
  projects: Project[]
}

/** Après l'arrivée en haut de la grille, les gestes vers le haut sont ignorés pendant ce délai (inertie trackpad). */
const GARDE_HAUT_MS = 400
/** Puis il faut ce cumul, sur un geste neuf, pour revenir au hero. */
const CUMUL_RETOUR_PX = 80
/** Deux événements molette séparés de plus que ça appartiennent à deux gestes. */
const PAUSE_GESTE_MS = 150

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DURATION = '600ms'

export default function ScrollController({ projects }: Props) {
  const [view, setView] = useState<View>('hero')
  const [isLeaving, setIsLeaving] = useState(false)
  const transitioning = useRef(false)
  const touchStartY = useRef(0)
  /*
   * Avec six tuiles la grille fait deux rangées et dépasse l'écran : le panneau
   * projets défile alors en interne. Le retour au hero demande un geste
   * intentionnel depuis le haut (voir `retourPermis`). Quand la grille tient sur
   * un écran, rien ne change : un geste vers le haut ramène au hero.
   */
  const projectsPanel = useRef<HTMLDivElement>(null)
  const intention = useRef({ arriveeEnHaut: 0, gesteArrivee: -1, geste: 0, dernierWheel: 0, cumul: 0, toucherDepuisHaut: false })

  const goTo = useCallback((next: View) => {
    if (transitioning.current) return
    transitioning.current = true

    if (next === 'projects') {
      // Animate hero out, then switch view
      setIsLeaving(true)
      setTimeout(() => {
        setView('projects')
        setIsLeaving(false)
        setTimeout(() => { transitioning.current = false }, 600)
      }, 1000)
    } else {
      // Simple fade back to hero
      setView('hero')
      setTimeout(() => { transitioning.current = false }, 900)
    }
  }, [])

  const viewRef = useRef<View>('hero')
  useEffect(() => { viewRef.current = view }, [view])

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = '' }
  }, [])

  useEffect(() => {
    const panneau = projectsPanel.current
    const etat = intention.current
    const deborde = () => (panneau ? panneau.scrollHeight - panneau.clientHeight > 1 : false)
    const enHaut = () => (panneau?.scrollTop ?? 0) <= 0

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

    const onWheel = (e: WheelEvent) => {
      const t = performance.now()
      if (t - etat.dernierWheel > PAUSE_GESTE_MS) {
        etat.geste++
        etat.cumul = 0
      }
      etat.dernierWheel = t
      onPanelScroll()
      if (e.deltaY > 0 && viewRef.current === 'hero') {
        goTo('projects')
        return
      }
      if (e.deltaY >= 0 || viewRef.current !== 'projects') return
      // La grille tient sur l'écran : comportement d'origine.
      if (!deborde()) {
        goTo('hero')
        return
      }
      // Sinon : depuis le haut seulement, pas sur l'élan du geste qui y a mené, et sur un cumul franc.
      if (!enHaut() || etat.geste === etat.gesteArrivee || t - etat.arriveeEnHaut < GARDE_HAUT_MS) return
      etat.cumul += -e.deltaY
      if (etat.cumul >= CUMUL_RETOUR_PX) {
        etat.cumul = 0
        goTo('hero')
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
      if (delta > 30 && viewRef.current === 'hero') goTo('projects')
      else if (viewRef.current === 'projects') {
        if (!deborde()) {
          if (delta < -30) goTo('hero')
        } else if (etat.toucherDepuisHaut && delta < -CUMUL_RETOUR_PX) {
          goTo('hero')
        }
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    panneau?.addEventListener('scroll', onPanelScroll, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      panneau?.removeEventListener('scroll', onPanelScroll)
    }
  }, [goTo])

  // Clavier : le panneau n'est focalisable que s'il défile ; flèches et espace restent au navigateur
  // (le contrôleur n'écoute aucune touche). Retour au hero : on remet la grille en haut.
  useEffect(() => {
    const panneau = projectsPanel.current
    if (!panneau) return
    const regler = () => {
      const defile = view === 'projects' && panneau.scrollHeight - panneau.clientHeight > 1
      if (defile) panneau.tabIndex = 0
      else panneau.removeAttribute('tabindex')
    }
    regler()
    window.addEventListener('resize', regler)
    const remise = view === 'hero' ? window.setTimeout(() => { panneau.scrollTop = 0 }, 700) : 0
    return () => {
      window.removeEventListener('resize', regler)
      if (remise) window.clearTimeout(remise)
    }
  }, [view])

  const panelBase: CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    transition: `opacity ${DURATION} ${EASE}, transform ${DURATION} ${EASE}`,
  }

  const heroStyle: CSSProperties = {
    ...panelBase,
    opacity: view === 'hero' ? 1 : 0,
    transform: view === 'hero' ? 'translateY(0)' : 'translateY(-40px)',
    transitionDelay: view === 'hero' ? '300ms' : '0ms',
    pointerEvents: view === 'hero' ? 'auto' : 'none',
  }

  const projectsStyle: CSSProperties = {
    ...panelBase,
    overflowY: view === 'projects' ? 'auto' : 'hidden',
    overscrollBehavior: 'contain',
    opacity: view === 'projects' ? 1 : 0,
    transform: view === 'projects' ? 'translateY(0)' : 'translateY(40px)',
    transitionDelay: view === 'projects' ? '300ms' : '0ms',
    pointerEvents: view === 'projects' ? 'auto' : 'none',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div style={heroStyle}>
        <HeroSection onStart={() => goTo('projects')} isLeaving={isLeaving} />
      </div>
      <div ref={projectsPanel} style={projectsStyle} role="region" aria-label="Mes réalisations">
        <FeaturedProjects projects={projects} isActive={view === 'projects'} />
      </div>
    </div>
  )
}
