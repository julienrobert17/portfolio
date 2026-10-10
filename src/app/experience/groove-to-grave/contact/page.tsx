import type { Metadata } from 'next'
import Link from 'next/link'
import { label, textes } from '@/components/experience/groove-to-grave/content/label'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import Newsletter from '@/components/experience/groove-to-grave/sections/newsletter'
import { CassetteVierge } from '@/components/experience/groove-to-grave/ui/cassette'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

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
      <section className="g2g-entete-page" aria-labelledby="contact">
        <TitrePage id="contact" texte="Contact" teinte="rouge">
          Contact
        </TitrePage>
        <div className="g2g-une" style={{ marginTop: 'var(--s4)' }}>
          <CassetteVierge />
          <div className="g2g-pile">
            <h2 className="g2g-affiche g2g-titre-section">Envoie ta tape</h2>
            <p>
              {textes.demo.body}
              <span className="g2g-brouillon">brouillon</span>
            </p>
            <p>{label.contact ?? 'L’adresse de contact reste à obtenir du label. En attendant, le message passe par Instagram.'}</p>
            <ul className="g2g-liens" style={{ marginTop: 0 }}>
              <li>
                <a href={label.reseaux[2].url} rel="noopener" className="g2g-bouton--principal">
                  Écrire sur Instagram
                </a>
              </li>
              <li>
                <Link href={`${routes.label}#demo`}>La procédure de démo</Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <Newsletter etat={newsletter} retour={routes.contact} />
    </>
  )
}
