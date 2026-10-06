'use client'

import Link from 'next/link'
import { GITHUB_URL, LINKEDIN_URL } from '@/lib/links'

export default function Header() {
  // Toutes les routes qui affichent le header (home, contact, projets, 404) sont sur le vert forêt.
  const color = '#d0f0d2'
  const background = 'rgba(13,39,30,0.85)'

  const linkStyle = {
    color,
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textDecoration: 'none',
  } as const

  const iconStyle = {
    color,
    display: 'inline-flex',
    alignItems: 'center',
    lineHeight: 0,
  } as const

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50, // au-dessus du sommaire sticky (sans z-index), sous la barre de progression (60)
      height: '56px',
      backgroundColor: background,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(48px, 6vw, 100px)',
    }}>
      <Link href="/" style={{
        color,
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textDecoration: 'none',
      }}>
        JR
      </Link>

      <nav aria-label="Navigation principale" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(18px, 2.2vw, 32px)',
      }}>
        <Link href="/#realisations" style={linkStyle}>Projets</Link>
        <Link href="/#a-propos" style={linkStyle}>À propos</Link>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          style={iconStyle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>
        </a>

        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          style={iconStyle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
          </svg>
        </a>

        <Link href="/contact" style={{ ...linkStyle, fontWeight: 800 }}>Contact</Link>
      </nav>
    </header>
  )
}
