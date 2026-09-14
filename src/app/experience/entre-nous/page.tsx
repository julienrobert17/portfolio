import type { Metadata } from 'next'
import { Fraunces, Nunito } from 'next/font/google'
import EntreNousLoader from '@/components/experience/entre-nous/entre-nous-loader'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' })

export const metadata: Metadata = {
  title: 'Entre nous',
  description: 'Un téléphone posé entre deux personnes.',
  robots: { index: false, follow: false },
}

export default function EntreNousPage() {
  return (
    <main
      className={`${fraunces.variable} ${nunito.variable}`}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: '#14120F',
        /*
         * L'expérience a sa propre palette nuit, et elle doit s'imposer quel
         * que soit le réglage du téléphone. `globals.css` fait varier
         * `--foreground` avec le thème de l'OS, et `<main>` en héritait : en
         * thème clair il portait un texte quasi noir, invisible sur ce fond.
         * Aucun écran n'en dépendait — tous posent leur propre couleur — mais
         * c'était un piège armé pour le premier texte ajouté ici.
         */
        color: '#F2EDE3',
        /*
         * Et `color-scheme` pour tout ce que la feuille de style ne peint pas
         * elle-même : contrôles natifs, barres de défilement, sélection de
         * texte, et le fond que le navigateur montre sous un rebond de
         * défilement. Sans lui, ces surfaces-là suivent encore le téléphone.
         */
        colorScheme: 'dark',
        // Le dispositif repose sur un écran plein : jamais de scroll global.
        overscrollBehavior: 'none',
      }}
    >
      <EntreNousLoader />
    </main>
  )
}
