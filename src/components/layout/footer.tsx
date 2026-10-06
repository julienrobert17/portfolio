'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'
import { GITHUB_URL, LINKEDIN_URL, REPO_URL } from '@/lib/links'

const AVAILABILITY_TEXT = 'Disponible pour de nouveaux projets'
const EMAIL = 'julien.robert17@gmail.com'
const TECH_LINE = 'Next.js · TypeScript · Tailwind · Prisma · Vercel · 2026'

interface Props {
  /** Version resserrée, pour tenir en bas du panneau À propos de la home. */
  compact?: boolean
}

export default function Footer({ compact = false }: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [])

  function copyEmail() {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  const linkStyle: CSSProperties = {
    color: '#d0f0d2',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textDecoration: 'none',
  }

  return (
    <footer style={{
      backgroundColor: compact ? 'transparent' : '#0d271e',
      color: '#d0f0d2',
      padding: compact ? '20px 24px 24px' : '56px var(--page-padding) 32px',
    }}>
      <div
        className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
        style={{ maxWidth: 1140, margin: '0 auto' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Julien Robert</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'rgba(240,247,242,0.7)',
          }}>
            <span aria-hidden="true" style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              animation: 'pulse-dot 2.4s ease-in-out infinite',
            }} />
            {AVAILABILITY_TEXT}
          </span>
        </div>

        <button
          type="button"
          onClick={copyEmail}
          aria-live="polite"
          title="Copier l’adresse"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#d0f0d2',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
            textDecoration: 'underline',
            textUnderlineOffset: 4,
            minWidth: '22ch',
            textAlign: 'left',
          }}
        >
          {copied ? 'Copié' : EMAIL}
        </button>

        <nav aria-label="Liens externes" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>GitHub</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>LinkedIn</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={linkStyle}>Code de ce site</a>
        </nav>
      </div>

      <p style={{
        maxWidth: 1140,
        margin: `${compact ? 16 : 32}px auto 0`,
        fontSize: 12,
        letterSpacing: '0.04em',
        opacity: 0.5,
      }}>
        {TECH_LINE}
      </p>
    </footer>
  )
}
