import type { Metadata } from 'next'
import { Fraunces, Nunito } from 'next/font/google'
import InvitationLoader from '@/components/experience/un-moment-hors-du-temps/invitation-loader'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Un moment hors du temps',
  description: 'Une demande, en huit écrans.',
  robots: { index: false, follow: false },
}

export default function UnMomentHorsDuTempsPage() {
  return (
    <main
      className={`${fraunces.variable} ${nunito.variable}`}
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#F7F1E6',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <InvitationLoader />
    </main>
  )
}
