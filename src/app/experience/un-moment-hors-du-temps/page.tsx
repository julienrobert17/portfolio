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
        /*
         * L'expérience a sa propre palette papier, et elle doit s'imposer quel
         * que soit le réglage du téléphone. `globals.css` fait varier
         * `--foreground` avec le thème de l'OS, et `<main>` en héritait : en
         * thème sombre il portait un texte quasi blanc sur ce crème, soit un
         * contraste de 1,04.
         */
        color: '#2E2A26',
        /*
         * `light` et non `dark` : ici la surface est claire. C'est ce qui
         * décide de l'apparence de ce que le navigateur dessine lui-même, et
         * notamment du menu déroulant natif de l'étape activité — sans ça, il
         * s'ouvre en sombre sur une page crème pour qui a son téléphone en
         * thème sombre.
         */
        colorScheme: 'light',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <InvitationLoader />
    </main>
  )
}
