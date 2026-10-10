import type { Metadata } from 'next'
import { Archivo, Permanent_Marker, VT323 } from 'next/font/google'
import type { ReactNode } from 'react'
import { sorties } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import FinDeBande from '@/components/experience/groove-to-grave/layout/fin-de-bande'
import SkinStatique from '@/components/experience/groove-to-grave/layout/skin-statique'
import SkipLink from '@/components/experience/groove-to-grave/layout/skip-link'
import { BASE, URL_SITE } from '@/components/experience/groove-to-grave/lib/routes'
import { variablesCss } from '@/components/experience/groove-to-grave/tokens'
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
 * Racine de « Groove To Grave » : palette du label en variables CSS quel que soit le thème de
 * l'OS, langue française, polices de l'expérience. Le lecteur (ici sa version statique) vit
 * dans ce layout, donc persistant entre toutes les pages de l'expérience.
 */
export default function GrooveToGraveLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`g2g ${archivo.variable} ${marker.variable} ${lcd.variable}`} lang="fr" id="haut" style={variablesCss()}>
      <SkipLink />
      <SkinStatique sorties={sorties.length} />
      <main id="contenu" className="g2g-page">
        {children}
      </main>
      <FinDeBande />
    </div>
  )
}
