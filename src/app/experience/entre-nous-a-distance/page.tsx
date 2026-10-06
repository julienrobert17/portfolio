import type { Metadata } from 'next'
import { Fraunces, Nunito } from 'next/font/google'
import LoaderADistance from '@/components/experience/entre-nous-a-distance/loader'
import { accentStyle } from '@/lib/accents'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' })

export const metadata: Metadata = {
  title: 'Entre nous — à distance',
  description: 'Deux téléphones, une salle.',
  robots: { index: false, follow: false },
}

export default function EntreNousADistancePage() {
  return (
    <main
      className={`${fraunces.variable} ${nunito.variable}`}
      data-project="entre-nous-a-distance"
      style={{
        ...accentStyle('entre-nous-a-distance'),
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#14120F',
        // Même règle que l'expérience d'origine : la palette nuit s'impose,
        // quel que soit le thème du téléphone.
        color: '#F2EDE3',
        colorScheme: 'dark',
        overscrollBehavior: 'none',
      }}
    >
      <LoaderADistance />
    </main>
  )
}
