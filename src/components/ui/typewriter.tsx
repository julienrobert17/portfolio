'use client'

import { useState, useEffect } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

interface TypewriterProps {
  text: string
  delay?: number
  className?: string
}

export default function Typewriter({ text, delay = 40, className }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  // Mouvement réduit : le texte est affiché complet, sans frappe ni curseur
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        const timeout = setTimeout(() => setShowCursor(false), 2000)
        return () => clearTimeout(timeout)
      }
    }, delay)

    return () => clearInterval(interval)
  }, [text, delay, reducedMotion])

  return (
    <span className={className}>
      {reducedMotion ? text : displayed}
      {showCursor && !reducedMotion && (
        <span
          aria-hidden
          style={{ animation: 'typewriter-blink 0.7s step-end infinite' }}
        >
          |
          <style>{`
            @keyframes typewriter-blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </span>
      )}
    </span>
  )
}
