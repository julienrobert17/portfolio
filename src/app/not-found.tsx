import type { Metadata } from 'next'
import Link from 'next/link'
import NotFoundBody from '@/components/not-found/not-found-body'

export const metadata: Metadata = {
  title: 'Page introuvable — Julien Robert',
}

export default function NotFound() {
  return (
    <main
      className="flex-1 flex flex-col justify-center"
      style={{
        backgroundColor: '#0d271e',
        color: '#d0f0d2',
        padding: '120px var(--page-padding) 96px',
      }}
    >
      <h1 style={{
        margin: 0,
        fontWeight: 800,
        lineHeight: 1.0,
        letterSpacing: '-0.03em',
        fontSize: 'clamp(96px, 16vw, 220px)',
        color: '#d0f0d2',
      }}>
        404
      </h1>

      <NotFoundBody />

      <div className="case-study-actions" style={{ margin: '40px 0 0' }}>
        <Link href="/">Retour à l’accueil</Link>
        <Link href="/#realisations">Voir les projets</Link>
      </div>
    </main>
  )
}
