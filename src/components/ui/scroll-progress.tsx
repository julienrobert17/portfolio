'use client'

import { useEffect, useRef } from 'react'

/**
 * Barre de progression de lecture, 2px en haut de page. Le transform est
 * écrit directement sur l'élément dans un rAF, sans state. Invisible quand
 * la page ne dépasse pas le viewport. À rendre dans le wrapper de la page
 * pour hériter de son `--accent`.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    let frame = 0

    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) {
        bar.style.opacity = '0'
        bar.style.transform = 'scaleX(0)'
        return
      }
      const ratio = Math.min(1, Math.max(0, window.scrollY / max))
      bar.style.opacity = '1'
      bar.style.transform = `scaleX(${ratio})`
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'var(--accent)',
        transformOrigin: 'left',
        transform: 'scaleX(0)',
        opacity: 0,
        transition: 'opacity 200ms ease',
        zIndex: 60,
        pointerEvents: 'none',
      }}
    />
  )
}
