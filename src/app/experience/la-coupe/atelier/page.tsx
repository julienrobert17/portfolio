import type { Metadata } from 'next'
import { atelier } from '@/components/experience/la-coupe/content/atelier'
import AtelierIntro from '@/components/experience/la-coupe/sections/atelier-intro'
import Distinctions from '@/components/experience/la-coupe/sections/distinctions'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'
import Equipe from '@/components/experience/la-coupe/sections/equipe'
import Methode from '@/components/experience/la-coupe/sections/methode'

export const metadata: Metadata = {
  title: 'Atelier',
  description: atelier.intro,
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
