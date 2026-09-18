import type { Metadata } from 'next'
import { site } from '@/components/experience/la-coupe/content/site'
import ContactBloc from '@/components/experience/la-coupe/sections/contact-bloc'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'

const CHEMIN = `${site.base}/contact`
/** Image générée par opengraph-image.tsx à la racine de l'expérience : Next ne la propage pas quand la page redéfinit openGraph. */
const IMAGE_OG = { url: `${site.base}/opengraph-image`, width: 1200, height: 630, alt: `${site.nom} — ${site.hero.ligne}` }

export const metadata: Metadata = {
  title: 'Contact',
  description: site.contact.intro,
  alternates: { canonical: CHEMIN },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: site.nom, url: CHEMIN, images: [IMAGE_OG] },
  twitter: { card: 'summary_large_image' },
}

export default function ContactPage() {
  return (
    <>
      <EntetePage surtitre={`${site.ville} — réponse sous trois jours`} titre={site.contact.cta} intro={site.contact.intro} />
      <ContactBloc />
    </>
  )
}
