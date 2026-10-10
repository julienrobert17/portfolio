import type { Metadata } from 'next'
import Link from 'next/link'
import { label, textes } from '@/components/experience/groove-to-grave/content/label'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import Newsletter from '@/components/experience/groove-to-grave/sections/newsletter'
import { CassetteVierge } from '@/components/experience/groove-to-grave/ui/cassette'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contacter ${label.nom}, newsletter, envoyer une démo.`,
}

interface Props {
  searchParams: Promise<{ newsletter?: string }>
}

/** Contacts (adresse à obtenir du label, en attendant Instagram), newsletter, cassette vierge « envoie ta tape ». */
export default async function ContactPage({ searchParams }: Props) {
  const { newsletter } = await searchParams
  return (
    <>
      <section className="g2g-section g2g-une" aria-labelledby="contact">
        <CassetteVierge />
        <div>
          <h1 id="contact" className="g2g-affiche g2g-titre">
            Envoie ta tape
          </h1>
          <p className="g2g-prose">
            {textes.demo.body}
            <span className="g2g-brouillon">brouillon</span>
          </p>
          <p className="g2g-sous">
            {label.contact ?? 'L’adresse de contact reste à obtenir du label. En attendant, le message passe par Instagram.'}
          </p>
          <ul className="g2g-liens">
            <li>
              <a href={label.reseaux[2].url} rel="noopener" className="g2g-bouton--rouge">
                Écrire sur Instagram
              </a>
            </li>
            <li>
              <Link href={`${routes.label}#demo`}>La procédure de démo</Link>
            </li>
          </ul>
        </div>
      </section>
      <Newsletter etat={newsletter} retour={routes.contact} />
    </>
  )
}
