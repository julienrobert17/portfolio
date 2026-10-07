'use client'

import type { CSSProperties } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

interface Props {
  /** Index du panneau courant, source de vérité : scroll-controller. */
  index: number
  count: number
  /** Bascule vers un panneau, par la même transition que la molette. */
  onSelect: (index: number) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const arrowStyle: CSSProperties = {
  display: 'inline-flex',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--accent-dim)',
  lineHeight: 0,
}

/**
 * Compteur de panneau de la home, avec une flèche vers le panneau voisin de
 * chaque côté. Le chiffre est remonté (key) à chaque changement d'index : la
 * classe CSS `panel-counter-num` joue le slide et le fondu, sans state ni
 * effet. Caché sous 1024px.
 */
export default function PanelCounter({ index, count, onSelect }: Props) {
  const reducedMotion = useReducedMotion()
  const isFirst = index <= 0
  const isLast = index >= count - 1

  return (
    <div
      className="hidden lg:flex"
      style={{
        position: 'fixed',
        left: 'clamp(20px, 2.5vw, 40px)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <button
        type="button"
        className="panel-arrow panel-arrow-up"
        aria-label="Panneau précédent"
        onClick={() => onSelect(index - 1)}
        style={{ ...arrowStyle, visibility: isFirst ? 'hidden' : 'visible' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 10.5L8 5.5L13 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span
        aria-label={`Panneau ${index + 1} sur ${count}`}
        style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--accent-dim)',
          lineHeight: 1,
        }}
      >
        <span
          key={index}
          className={reducedMotion ? undefined : 'panel-counter-num'}
          style={{ display: 'inline-block' }}
        >
          {pad(index + 1)}
        </span>
        {' / '}
        {pad(count)}
      </span>

      <button
        type="button"
        className="panel-arrow panel-arrow-down"
        aria-label="Panneau suivant"
        onClick={() => onSelect(index + 1)}
        style={{ ...arrowStyle, visibility: isLast ? 'hidden' : 'visible' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 5.5L8 10.5L13 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
