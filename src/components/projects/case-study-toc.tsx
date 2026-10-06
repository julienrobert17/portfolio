'use client'

import { useEffect, useRef } from 'react'
import type { Heading } from '@/lib/case-studies'

interface Props {
  headings: Heading[]
}

/**
 * Sommaire sticky généré depuis les h2. L'entrée active est posée par
 * classe CSS directement sur le lien, depuis un IntersectionObserver,
 * sans state. Caché sous 1024px.
 */
export default function CaseStudyToc({ headings }: Props) {
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[data-id]'))
    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)
    if (targets.length === 0) return

    const setActive = (id: string) => {
      links.forEach((a) => a.classList.toggle('is-active', a.dataset.id === id))
    }
    // À chaque franchissement d'un titre, le titre actif est le dernier
    // passé au-dessus du premier cinquième de l'écran.
    const refresh = () => {
      const limit = window.innerHeight * 0.2
      let active = targets[0].id
      for (const t of targets) {
        if (t.getBoundingClientRect().top <= limit) active = t.id
      }
      setActive(active)
    }

    const observer = new IntersectionObserver(refresh, {
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0,
    })
    targets.forEach((t) => observer.observe(t))
    refresh()
    return () => observer.disconnect()
  }, [headings])

  return (
    <nav
      ref={navRef}
      aria-label="Sommaire"
      className="case-study-toc hidden lg:block"
      style={{ position: 'sticky', top: 96, alignSelf: 'start' }}
    >
      {headings.map((h) => (
        <a key={h.id} href={`#${h.id}`} data-id={h.id}>
          {h.text}
        </a>
      ))}
    </nav>
  )
}
