import type { Metadata } from 'next'
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
    </main>
  )
}
