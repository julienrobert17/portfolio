import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjet, projetSuivant, projets } from '@/components/experience/la-coupe/content'
import { site } from '@/components/experience/la-coupe/content/site'
import { imageProjet } from '@/components/experience/la-coupe/lib/images'
import Dessins from '@/components/experience/la-coupe/sections/dessins'
import FicheDossier from '@/components/experience/la-coupe/sections/fiche-dossier'
import FicheHero from '@/components/experience/la-coupe/sections/fiche-hero'
import Galerie from '@/components/experience/la-coupe/sections/galerie'
import ProjetSuivant from '@/components/experience/la-coupe/sections/projet-suivant'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return projets.map((p) => ({ slug: p.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const projet = getProjet(slug)
  if (!projet) return {}
  const image = imageProjet(projet, 0)
  return {
    title: projet.titre,
    description: `${projet.programme}, ${projet.lieu}, ${projet.annee}. ${projet.texte.replace(/\*/g, '').slice(0, 140)}…`,
    openGraph: {
      type: 'article',
      title: projet.titre,
      description: `${projet.programme} — ${projet.lieu}, ${projet.annee}`,
      images: [{ url: image.src, width: image.width, height: image.height, alt: image.alt }],
    },
  }
}

export default async function ProjetPage({ params }: Props) {
  const { slug } = await params
  const projet = getProjet(slug)
  if (!projet) notFound()
  const suivant = projetSuivant(slug)
  const image = imageProjet(projet, 0)
  const creativeWork = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: projet.titre,
    description: projet.texte.replace(/\*/g, ''),
    dateCreated: String(projet.annee),
    locationCreated: { '@type': 'Place', name: projet.lieu },
    genre: projet.programme,
    creator: { '@type': 'Organization', name: site.nom },
    image: image.src,
    url: `${site.base}/projets/${projet.slug}`,
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWork) }} />
      <FicheHero projet={projet} />
      <FicheDossier projet={projet} />
      <Galerie projet={projet} />
      <Dessins projet={projet} />
      <ProjetSuivant projet={suivant} />
    </article>
  )
}
