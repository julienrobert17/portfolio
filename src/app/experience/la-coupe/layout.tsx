import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif } from 'next/font/google'
import type { ReactNode } from 'react'
import { site } from '@/components/experience/la-coupe/content/site'
import Footer from '@/components/experience/la-coupe/layout/footer'
import Nav from '@/components/experience/la-coupe/layout/nav'
import SkipLink from '@/components/experience/la-coupe/layout/skip-link'
import SmoothScroll from '@/components/experience/la-coupe/layout/smooth-scroll'
import '@/components/experience/la-coupe/styles/la-coupe.css'

const display = Instrument_Sans({
  subsets: ['latin'],
  variable: '--lc-font-display',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--lc-font-serif',
  display: 'swap',
})

const URL_SITE = 'https://portfolio-eight-sable-66.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: `${site.nom} — ${site.activite}`,
    template: `%s — ${site.nom}`,
  },
  description: site.description,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: site.nom,
    title: `${site.nom} — ${site.activite}`,
    description: site.description,
    url: site.base,
  },
}

const organisation = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.nom,
  url: `${URL_SITE}${site.base}`,
  email: site.contact.email,
  telephone: site.contact.telephone,
  foundingDate: String(site.depuis),
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.contact.adresse[0],
    postalCode: site.contact.adresse[1].split(' ')[0],
    addressLocality: site.ville,
    addressCountry: 'FR',
  },
}

/**
 * Racine de « la Coupe » : palette papier imposée quel que soit le thème de
 * l'OS, langue française, polices de l'expérience. Nav et footer communs.
 * Lenis et le canvas partagent le ticker GSAP ; transitions en Phase 4.
 */
export default function LaCoupeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`lc ${display.variable} ${serif.variable}`} lang="fr">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }} />
      <SkipLink />
      <Nav />
      <main id="contenu">{children}</main>
      <Footer />
      <SmoothScroll />
    </div>
  )
}
