'use client'

import { useEffect, useRef, Children, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
}

export default function Reveal({ children, className }: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {Children.map(children, (child) => (
        <div
          style={{
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
