import type { Metadata } from 'next'
import localFont from 'next/font/local'
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

// Polices auto-hébergées, sous-ensemblées par scripts/g2g-polices.ts (bloc 6.1) : Archivo
// variable restreinte aux largeurs 75 à 100 % et graisses 400 à 900, les trois au jeu de
// caractères du site. Seule Archivo est préchargée ; les deux autres arrivent en swap.
const archivo = localFont({
  src: '../../../components/experience/groove-to-grave/polices/archivo.woff2',
  weight: '400 900',
  variable: '--g2g-font-archivo',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 100%' }],
})

const marker = localFont({
  src: '../../../components/experience/groove-to-grave/polices/permanent-marker.woff2',
  weight: '400',
  variable: '--g2g-font-marker',
  display: 'swap',
  preload: false,
})

const lcd = localFont({
  src: '../../../components/experience/groove-to-grave/polices/vt323.woff2',
  weight: '400',
  variable: '--g2g-font-lcd',
  display: 'swap',
  preload: false,
})

const TITRE = label.nom

/**
 * Origine canonique du site, paramétrable : `G2G_URL_SITE` (sans barre finale) le jour où la
 * plateforme part sur le domaine du label ; sinon l'URL du portfolio (bloc 7.0).
 */
const ORIGINE = (process.env.G2G_URL_SITE ?? URL_SITE).replace(/\/$/, '')

/**
 * Métadonnées communes. Plateforme officielle du label depuis le bloc 7.0 (carte blanche), mais
 * le domaine final n'est pas choisi (sous le portfolio ou domaine du label) : le `noindex` reste
 * jusqu'à ce choix, pour ne pas indexer une adresse qui changera ; à retirer avec la décision,
 * en même temps que la variable d'origine. openGraph n'est pas fusionné entre layout et page par
 * Next, les pages redonnent le leur.
 */
export const metadata: Metadata = {
  metadataBase: new URL(ORIGINE),
  title: { default: TITRE, template: `%s — ${label.nom}` },
  description: label.presentation.body,
  alternates: { canonical: `${ORIGINE}${BASE}` },
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
