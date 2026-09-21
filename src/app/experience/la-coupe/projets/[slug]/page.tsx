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

/** Même valeur que metadataBase du layout : le JSON-LD veut des URL absolues. */
const URL_SITE = 'https://portfolio-eight-sable-66.vercel.app'

/**
 * L'image og:image vient de ./opengraph-image.tsx (PNG généré au build) : les
 * photos placeholder sont des SVG, que les crawleurs sociaux ne rendent pas.
 * Ne pas déclarer `images` ici, sinon Next n'ajoute pas le fichier généré.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const projet = getProjet(slug)
  if (!projet) return {}
  const chemin = `${site.base}/projets/${projet.slug}`
  const sousTitre = `${projet.programme} — ${projet.lieu}, ${projet.annee}`
  return {
    title: projet.titre,
    description: `${projet.programme}, ${projet.lieu}, ${projet.annee}. ${projet.texte.replace(/\*/g, '').slice(0, 140)}…`,
    alternates: { canonical: chemin },
    openGraph: {
      type: 'article',
      locale: 'fr_FR',
      siteName: site.nom,
      url: chemin,
      title: projet.titre,
      description: sousTitre,
    },
    twitter: { card: 'summary_large_image', title: projet.titre, description: sousTitre },
  }
}

export default async function ProjetPage({ params }: Props) {
  const { slug } = await params
  const projet = getProjet(slug)
  if (!projet) notFound()
  const suivant = projetSuivant(slug)
  const image = imageProjet(projet, 0)
  const urlFiche = `${URL_SITE}${site.base}/projets/${projet.slug}`
  // JSON-LD schema.org : la fiche comme CreativeWork de l'atelier, plus le fil d'Ariane.
  const creativeWork = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${urlFiche}#oeuvre`,
    name: projet.titre,
    description: projet.texte.replace(/\*/g, ''),
    dateCreated: String(projet.annee),
    locationCreated: { '@type': 'Place', name: projet.lieu },
    genre: projet.programme,
    creator: { '@type': 'Organization', '@id': `${URL_SITE}${site.base}#organisation`, name: site.nom, url: `${URL_SITE}${site.base}` },
    image: [`${urlFiche}/opengraph-image`, `${URL_SITE}${image.src}`],
    url: urlFiche,
    inLanguage: 'fr',
  }
  const filAriane = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.nom, item: `${URL_SITE}${site.base}` },
      { '@type': 'ListItem', position: 2, name: 'Projets', item: `${URL_SITE}${site.base}/projets` },
      { '@type': 'ListItem', position: 3, name: projet.titre, item: urlFiche },
    ],
  }
  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([creativeWork, filAriane]) }} />
      <FicheHero projet={projet} />
      <FicheDossier projet={projet} />
      <Galerie projet={projet} />
      <Dessins projet={projet} />
      <ProjetSuivant projet={suivant} />
    </article>
  )
}
