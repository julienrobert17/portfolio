'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const SUBTITLE = 'Cette page a disparu il y a 420 millions d’années.'
const SUBTITLE_LATE = 'Toujours là ? Ça fait 420 millions d’années et dix secondes.'

/** Décalage vertical pseudo-aléatoire mais déterministe depuis l'index : identique serveur et client. */
function fossilOffset(index: number): number {
  return ((index * 7919 + 13) % 9) - 4
}

export default function NotFoundBody() {
  const pathname = usePathname()
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const chars = Array.from(pathname)

  useEffect(() => {
    const el = subtitleRef.current
    if (!el) return
    const timer = setTimeout(() => el.classList.add('is-late'), 10_000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <p ref={subtitleRef} className="nf-subtitle" style={{
        margin: '24px 0 0',
        fontSize: 'clamp(18px, 1.4vw, 22px)',
        fontWeight: 500,
        color: '#d0f0d2',
      }}>
        <span className="nf-main">{SUBTITLE}</span>
        <span className="nf-alt" aria-hidden="true">{SUBTITLE_LATE}</span>
      </p>

      <p style={{
        margin: '32px 0 0',
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize: 13,
        letterSpacing: '0.06em',
        color: 'var(--accent-dim)',
      }}>
        On a retrouvé le fossile :{' '}
        <span aria-label={pathname} style={{ display: 'inline-block', whiteSpace: 'pre', color: '#8fb89c' }}>
          {chars.map((char, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                display: 'inline-block',
                transform: `translateY(${fossilOffset(i)}px)`,
                opacity: Math.max(0.25, 1 - (i / Math.max(chars.length, 1)) * 0.75),
              }}
            >
              {char}
            </span>
          ))}
        </span>
      </p>
    </>
  )
}
