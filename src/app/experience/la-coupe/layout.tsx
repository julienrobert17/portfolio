import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif } from 'next/font/google'
import type { ReactNode } from 'react'
import CanvasHost from '@/components/experience/la-coupe/canvas/canvas-host'
import { site } from '@/components/experience/la-coupe/content/site'
import { CLE_SESSION_PRECHARGEUR, PRELOADER_ACTIF } from '@/components/experience/la-coupe/lib/prechargeur'
import Footer from '@/components/experience/la-coupe/layout/footer'
import Nav from '@/components/experience/la-coupe/layout/nav'
import SkipLink from '@/components/experience/la-coupe/layout/skip-link'
import Menu from '@/components/experience/la-coupe/layout/menu'
import PageTransition from '@/components/experience/la-coupe/layout/page-transition'
import Prechargeur from '@/components/experience/la-coupe/layout/prechargeur'
import SmoothScroll from '@/components/experience/la-coupe/layout/smooth-scroll'
import Curseur from '@/components/experience/la-coupe/ui/curseur'
import Magnetisme from '@/components/experience/la-coupe/ui/magnetisme'
import '@/components/experience/la-coupe/styles/la-coupe.css'

const display = Instrument_Sans({
  subsets: ['latin'],
  // Deux graisses statiques plutôt que la variable : deux fichiers plus petits, le titre arrive plus tôt.
  weight: ['400', '500'],
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

/**
 * Décision du préchargeur avant le premier paint : pose data-prechargeur sur
 * <html> (le CSS couvre alors la page d'un voile papier) si accueil, session
 * vierge et pas de mouvement réduit. Si le script échoue, l'attribut est
 * absent et rien n'est couvert ; s'il reste, un filet de 4 s le retire.
 */
const scriptPrechargeur = PRELOADER_ACTIF
  ? `(function(){try{var h=document.documentElement;if(location.pathname!==${JSON.stringify(site.base)})return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem(${JSON.stringify(CLE_SESSION_PRECHARGEUR)})==='1')return;h.setAttribute('data-prechargeur','');setTimeout(function(){h.removeAttribute('data-prechargeur')},4000)}catch(e){}})()`
  : ''

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
      {scriptPrechargeur ? <script dangerouslySetInnerHTML={{ __html: scriptPrechargeur }} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }} />
      <CanvasHost />
      <SkipLink />
      <Nav />
      <main id="contenu">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <Menu />
      <Prechargeur />
      <Curseur />
      <Magnetisme />
      <SmoothScroll />
    </div>
  )
}
