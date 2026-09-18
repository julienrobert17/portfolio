import type { Metadata } from 'next'
import { Suspense } from 'react'
import { projets } from '@/components/experience/la-coupe/content'
import { site } from '@/components/experience/la-coupe/content/site'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'
import ProjetsClient, { VueProjets } from '@/components/experience/la-coupe/sections/projets-client'

const CHEMIN = `${site.base}/projets`
/** Image générée par opengraph-image.tsx à la racine de l'expérience : Next ne la propage pas quand la page redéfinit openGraph. */
const IMAGE_OG = { url: `${site.base}/opengraph-image`, width: 1200, height: 630, alt: `${site.nom} — ${site.hero.ligne}` }

export const metadata: Metadata = {
  title: 'Projets',
  description: 'Les huit projets de l’atelier : maisons, équipements publics, logements, réhabilitations.',
  alternates: { canonical: CHEMIN },
  // Titre et description hérités de ceux de la page ; l'objet remplace celui du layout, d'où siteName et locale.
  openGraph: { type: 'website', locale: 'fr_FR', siteName: site.nom, url: CHEMIN, images: [IMAGE_OG] },
  twitter: { card: 'summary_large_image' },
}

/**
 * Page statique : l'état (vue, filtre) vit dans l'URL et se lit côté client.
 * Le repli du Suspense est l'état par défaut, servi dans le HTML : sans
 * JavaScript la liste complète est là et les liens des filtres restent valides.
 */
export default function ProjetsPage() {
  return (
    <>
      <EntetePage surtitre={`${projets.length} projets — 2011 à aujourd’hui`} titre="Projets" />
      <div className="lc-container" style={{ paddingBottom: 'var(--s-8)' }}>
        <Suspense fallback={<VueProjets vue="liste" categorie={null} />}>
          <ProjetsClient />
        </Suspense>
      </div>
    </>
  )
}
