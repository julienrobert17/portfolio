import type { Metadata } from 'next'
import { atelier } from '@/components/experience/la-coupe/content/atelier'
import { site } from '@/components/experience/la-coupe/content/site'
import AtelierIntro from '@/components/experience/la-coupe/sections/atelier-intro'
import Distinctions from '@/components/experience/la-coupe/sections/distinctions'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'
import Equipe from '@/components/experience/la-coupe/sections/equipe'
import Methode from '@/components/experience/la-coupe/sections/methode'

const CHEMIN = `${site.base}/atelier`
/** Image générée par opengraph-image.tsx à la racine de l'expérience : Next ne la propage pas quand la page redéfinit openGraph. */
const IMAGE_OG = { url: `${site.base}/opengraph-image`, width: 1200, height: 630, alt: `${site.nom} — ${site.hero.ligne}` }

export const metadata: Metadata = {
  title: 'Atelier',
  description: atelier.intro,
  alternates: { canonical: CHEMIN },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: site.nom, url: CHEMIN, images: [IMAGE_OG] },
  twitter: { card: 'summary_large_image' },
}

export default function AtelierPage() {
  return (
    <>
      <EntetePage surtitre="Studio, équipe, méthode" titre={atelier.titre} intro={atelier.intro} />
      <AtelierIntro />
      <Methode />
      <Equipe />
      <Distinctions />
    </>
  )
}
