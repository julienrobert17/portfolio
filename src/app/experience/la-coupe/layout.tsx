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

// Seule la graisse du titre (500) est préchargée : c'est elle qui fait le LCP. Le texte
// courant (400) et l'italique serif arrivent via le CSS, sans peser sur le chemin critique.
const display = Instrument_Sans({
  subsets: ['latin'],
  weight: '500',
  variable: '--lc-font-display',
  display: 'swap',
})

const texte = Instrument_Sans({
  subsets: ['latin'],
  weight: '400',
  variable: '--lc-font-texte',
  display: 'swap',
  preload: false,
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--lc-font-serif',
  display: 'swap',
  preload: false,
})

const URL_SITE = 'https://portfolio-eight-sable-66.vercel.app'
const TITRE = `${site.nom} — ${site.activite}`

/**
 * Métadonnées communes. openGraph et twitter ne sont pas fusionnés par Next
 * entre layout et page (une page qui les définit remplace l'objet entier) :
 * les pages en redonnent donc une version complète avec leur propre url.
 * L'image og:image vient du fichier opengraph-image.tsx, ajoutée par Next.
 */
export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: TITRE,
    template: `%s — ${site.nom}`,
  },
  description: site.description,
  alternates: { canonical: site.base },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: site.nom,
    title: TITRE,
    description: site.description,
    url: site.base,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITRE,
    description: site.description,
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

/** JSON-LD schema.org : Organization avec adresse postale et réseaux (sameAs). */
const organisation = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${URL_SITE}${site.base}#organisation`,
  name: site.nom,
  description: site.description,
  url: `${URL_SITE}${site.base}`,
  image: `${URL_SITE}${site.base}/opengraph-image`,
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
  sameAs: site.reseaux.map((r) => r.href),
}

/**
 * Racine de « la Coupe » : palette papier imposée quel que soit le thème de
 * l'OS, langue française, polices de l'expérience. Nav et footer communs.
 * Lenis et le canvas partagent le ticker GSAP ; transitions en Phase 4.
 */
export default function LaCoupeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`lc ${display.variable} ${texte.variable} ${serif.variable}`} lang="fr">
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
