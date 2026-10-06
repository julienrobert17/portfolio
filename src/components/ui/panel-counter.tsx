'use client'

import { useState } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

interface Props {
  /** Index du panneau courant, source de vérité : scroll-controller. */
  index: number
  count: number
  onSelect: (index: number) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Compteur de panneau de la home. Le chiffre est remonté (key) à chaque
 * changement d'index : la classe CSS `panel-counter-num` joue le slide
 * et le fondu, sans state ni effet. Caché sous 1024px.
 */
export default function PanelCounter({ index, count, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const reducedMotion = useReducedMotion()

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
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Panneau ${index + 1} sur ${count}, changer de panneau`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
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
      </button>

      {open && (
        <div role="group" aria-label="Aller au panneau" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 2 }}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller au panneau ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => { onSelect(i); setOpen(false) }}
              style={{
                width: 8,
                height: 8,
                padding: 0,
                borderRadius: '50%',
                border: '1px solid var(--accent-dim)',
                backgroundColor: i === index ? 'var(--accent)' : 'transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
