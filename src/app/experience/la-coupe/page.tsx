import { projets } from '@/components/experience/la-coupe/content/projets'
import { site } from '@/components/experience/la-coupe/content/site'
import AtelierTeaser from '@/components/experience/la-coupe/sections/atelier-teaser'
import Hero from '@/components/experience/la-coupe/sections/hero'
import IndexProjets from '@/components/experience/la-coupe/sections/index-projets'
import Manifeste from '@/components/experience/la-coupe/sections/manifeste'
import ProjetsSelectionnes from '@/components/experience/la-coupe/sections/projets-selectionnes'

export default function AccueilPage() {
  return (
    <>
      <Hero />
      <Manifeste />
      <ProjetsSelectionnes />
      <IndexProjets
        projets={projets}
        titre="Index"
        lien={{ label: `Voir les ${projets.length} projets`, href: `${site.base}/projets` }}
      />
      <AtelierTeaser />
    </>
  )
}
