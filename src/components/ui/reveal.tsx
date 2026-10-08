'use client'

import { useEffect, useRef, Children, ReactNode } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

interface RevealProps {
  children: ReactNode
  className?: string
}

export default function Reveal({ children, className }: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Mouvement réduit : tout est visible d'emblée, sans observer
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container || reducedMotion) return

    const items = Array.from(container.children) as HTMLElement[]

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        items.forEach((item, i) => {
          item.style.transitionDelay = `${i * 100}ms`
          item.style.opacity = '1'
          item.style.transform = 'translateY(0)'
        })
        observer.disconnect()
      },
      { threshold: 0.1 },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <div ref={containerRef} className={className}>
      {Children.map(children, (child) => (
        <div
          style={reducedMotion ? undefined : {
            opacity: 0,
            transform: 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
