'use client'

import { useState, useEffect } from 'react'

interface TypewriterProps {
  text: string
  delay?: number
  className?: string
}

export default function Typewriter({ text, delay = 40, className }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
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
  }, [text, delay])

  return (
    <span className={className}>
      {displayed}
      {showCursor && (
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
