import type { Metadata } from 'next'
import { site } from '@/components/experience/la-coupe/content/site'
import ContactBloc from '@/components/experience/la-coupe/sections/contact-bloc'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'

export const metadata: Metadata = {
  title: 'Contact',
  description: site.contact.intro,
}

export default function ContactPage() {
  return (
    <>
      <EntetePage surtitre={`${site.ville} — réponse sous trois jours`} titre={site.contact.cta} intro={site.contact.intro} />
      <ContactBloc />
    </>
  )
}
