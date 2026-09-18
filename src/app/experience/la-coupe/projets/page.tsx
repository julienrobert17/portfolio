import type { Metadata } from 'next'
import { Suspense } from 'react'
import { projets } from '@/components/experience/la-coupe/content'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'
import ProjetsClient, { VueProjets } from '@/components/experience/la-coupe/sections/projets-client'

export const metadata: Metadata = {
  title: 'Projets',
  description: 'Les huit projets de l’atelier : maisons, équipements publics, logements, réhabilitations.',
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
