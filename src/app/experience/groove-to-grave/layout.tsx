import type { Metadata } from 'next'
import { Archivo, Permanent_Marker, VT323 } from 'next/font/google'
import type { ReactNode } from 'react'
import Mur from '@/components/experience/groove-to-grave/canvas/mur'
import { soireesAVenir } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import FinDeBande from '@/components/experience/groove-to-grave/layout/fin-de-bande'
import Lecteur from '@/components/experience/groove-to-grave/layout/lecteur'
import SkipLink from '@/components/experience/groove-to-grave/layout/skip-link'
import SmoothScroll from '@/components/experience/groove-to-grave/layout/smooth-scroll'
import TransitionPage from '@/components/experience/groove-to-grave/layout/transition-page'
import { catalogueLecteur } from '@/components/experience/groove-to-grave/lib/catalogue-lecteur'
import { dateLongue } from '@/components/experience/groove-to-grave/lib/format'
import { BASE, URL_SITE } from '@/components/experience/groove-to-grave/lib/routes'
import { variablesCss } from '@/components/experience/groove-to-grave/tokens'
import Collage from '@/components/experience/groove-to-grave/ui/collage'
import '@/components/experience/groove-to-grave/styles/g2g.css'

// Archivo variable en largeur et en graisse : titrage condensé et texte courant avec un seul fichier préchargé.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--g2g-font-archivo',
  display: 'swap',
})

const marker = Permanent_Marker({
  subsets: ['latin'],
  weight: '400',
  variable: '--g2g-font-marker',
  display: 'swap',
  preload: false,
})

const lcd = VT323({
  subsets: ['latin'],
  weight: '400',
  variable: '--g2g-font-lcd',
  display: 'swap',
  preload: false,
})

const TITRE = `${label.nom} — concept non officiel`

/**
 * Métadonnées communes. La route reste en preview tant que le label n'a pas donné son accord :
 * pas d'indexation. openGraph n'est pas fusionné entre layout et page par Next, les pages
 * redonnent le leur.
 */
export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: { default: TITRE, template: `%s — ${label.nom}` },
  description: label.presentation.body,
  alternates: { canonical: BASE },
  robots: { index: false, follow: false },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: label.nom, title: TITRE, description: label.presentation.body, url: BASE },
}

/**
 * Avant le premier paint : la racine sait que JavaScript est là (le CSS montre le lecteur, cache la
 * barre statique) et le document reçoit la classe qui réserve la place du skin collant au focus
 * (scroll-padding-top), retirée par la transition de page au démontage.
 */
const SCRIPT_JS = "document.currentScript.parentElement.setAttribute('data-js','');document.documentElement.classList.add('g2g-document')"

/**
 * Racine de « Groove To Grave » : palette du label en variables CSS quel que soit le thème de
 * l'OS, langue française, polices de l'expérience. Le lecteur vit dans ce layout, donc
 * persistant entre toutes les pages ; son moteur audio est un singleton de module. La
 * transition de page (avance rapide du mur, balayage du contenu) vit ici aussi.
 */
export default function GrooveToGraveLayout({ children }: { children: ReactNode }) {
  const prochaine = soireesAVenir()[0]
  const texteProchaine = prochaine ? `PROCHAINE SOIRÉE ${dateLongue(prochaine.date).toUpperCase()} · ${(prochaine.name ?? prochaine.venue).toUpperCase()}` : 'AUCUNE DATE ANNONCÉE · RESTE BRANCHÉ'
  return (
    <div className={`g2g ${archivo.variable} ${marker.variable} ${lcd.variable}`} lang="fr" id="haut" tabIndex={-1} style={variablesCss()}>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_JS }} />
      <Mur />
      <SkipLink />
      <Lecteur catalogue={catalogueLecteur()} prochaine={texteProchaine} />
      <main id="contenu" className="g2g-page">
        {children}
      </main>
      <FinDeBande />
      <Collage />
      <SmoothScroll />
      <TransitionPage />
    </div>
  )
}
