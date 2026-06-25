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

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DURATION = '600ms'

export default function ScrollController({ projects }: Props) {
  const [view, setView] = useState<View>('hero')
  const [isLeaving, setIsLeaving] = useState(false)
  const transitioning = useRef(false)
  const touchStartY = useRef(0)

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
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && viewRef.current === 'hero') goTo('projects')
      else if (e.deltaY < 0 && viewRef.current === 'projects') goTo('hero')
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      const delta = touchStartY.current - e.touches[0].clientY
      if (delta > 30 && viewRef.current === 'hero') goTo('projects')
      else if (delta < -30 && viewRef.current === 'projects') goTo('hero')
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [goTo])

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
      <div style={projectsStyle}>
        <FeaturedProjects projects={projects} isActive={view === 'projects'} />
      </div>
    </div>
  )
}
