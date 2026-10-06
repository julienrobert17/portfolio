import type { Metadata } from 'next'
import Link from 'next/link'
import PrototaxitesLoader from '@/components/experience/prototaxites/PrototaxitesLoader'
import { accentStyle } from '@/lib/accents'

export const metadata: Metadata = {
  title: 'Prototaxites — Une expérience',
  description:
    'Une expérience immersive autour des Prototaxites, organismes géants du Dévonien dont la nature reste inconnue à ce jour.',
}

export default function PrototaxitesPage() {
  return (
    <main
      data-project="prototaxites"
      style={{
        ...accentStyle('prototaxites'),
        position: 'fixed',
        inset: 0,
        height: '100dvh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <PrototaxitesLoader />
      {/* Lien discret vers l'étude de cas, hors de la scène, après 2 s */}
      <Link
        href="/projects/prototaxites"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          zIndex: 20,
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.55)',
          textDecoration: 'none',
          animation: 'slideUp 600ms cubic-bezier(0.16,1,0.3,1) 2s both',
        }}
      >
        Lire l&apos;étude de cas →
      </Link>
    </main>
  )
}
