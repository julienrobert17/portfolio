import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import type { ReactNode } from 'react'
import Mur from '@/components/experience/groove-to-grave/canvas/mur'
import FinDeBande from '@/components/experience/groove-to-grave/layout/fin-de-bande'
import Lecteur from '@/components/experience/groove-to-grave/layout/lecteur'
import Racine from '@/components/experience/groove-to-grave/layout/racine'
import SkipLink from '@/components/experience/groove-to-grave/layout/skip-link'
import SmoothScroll from '@/components/experience/groove-to-grave/layout/smooth-scroll'
import TransitionPage from '@/components/experience/groove-to-grave/layout/transition-page'
import { catalogueLecteur } from '@/components/experience/groove-to-grave/lib/catalogue-lecteur'
import { dateLongue } from '@/components/experience/groove-to-grave/lib/format'
import { MARQUE } from '@/components/experience/groove-to-grave/lib/marque'
import { BASE, URL_SITE } from '@/components/experience/groove-to-grave/lib/routes'
import { chargerContenu, soireesAVenir } from '@/components/experience/groove-to-grave/sanity/contenu'
import { archivo, lcd, marker } from '@/components/experience/groove-to-grave/polices'
import { variablesCss } from '@/components/experience/groove-to-grave/tokens'
import Collage from '@/components/experience/groove-to-grave/ui/collage'
import '@/components/experience/groove-to-grave/styles/g2g.css'

const TITRE = MARQUE.nom

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
export async function generateMetadata(): Promise<Metadata> {
  const { label } = await chargerContenu()
  return {
    metadataBase: new URL(ORIGINE),
    title: { default: TITRE, template: `%s — ${MARQUE.nom}` },
    description: label.presentation.body,
    alternates: { canonical: `${ORIGINE}${BASE}` },
    robots: { index: false, follow: false },
    openGraph: { type: 'website', locale: 'fr_FR', siteName: MARQUE.nom, title: TITRE, description: label.presentation.body, url: BASE },
  }
}

/**
 * Racine de « Groove To Grave » : palette du label en variables CSS quel que soit le thème de
 * l'OS, langue française, polices de l'expérience. Le lecteur vit dans ce layout, donc
 * persistant entre toutes les pages ; son moteur audio est un singleton de module. La
 * transition de page (avance rapide du mur, balayage du contenu) vit ici aussi. La racine
 * (`layout/racine.tsx`) pose `data-js` par le cycle de vie React, sans script en ligne.
 */
export default async function GrooveToGraveLayout({ children }: { children: ReactNode }) {
  const contenu = await chargerContenu()
  const prochaine = soireesAVenir(contenu.soirees)[0]
  const brouillon = (await draftMode()).isEnabled
  const texteProchaine = prochaine ? `PROCHAINE SOIRÉE ${dateLongue(prochaine.date).toUpperCase()} · ${(prochaine.name ?? prochaine.venue).toUpperCase()}` : 'AUCUNE DATE ANNONCÉE · RESTE BRANCHÉ'
  return (
    <Racine className={`g2g ${archivo.variable} ${marker.variable} ${lcd.variable}`} style={variablesCss()}>
      {/* Images et extraits viennent du CDN Sanity (Phase 7.4) : connexion ouverte d'avance, en clair pour les images, en CORS pour l'audio analysé. */}
      <link rel="preconnect" href="https://cdn.sanity.io" />
      <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
      <Mur />
      <SkipLink />
      <Lecteur catalogue={catalogueLecteur(contenu.sorties)} prochaine={texteProchaine} bandcamp={contenu.label.reseaux[0]?.url ?? MARQUE.bandcamp} />
      <main id="contenu" className="g2g-page">
        {children}
      </main>
      <FinDeBande />
      <Collage />
      <SmoothScroll />
      <TransitionPage />
      {brouillon ? (
        <p className="g2g-apercu" role="status">
          Aperçu des brouillons. <a href="/api/g2g/apercu/fin">Quitter</a>
        </p>
      ) : null}
    </Racine>
  )
}
