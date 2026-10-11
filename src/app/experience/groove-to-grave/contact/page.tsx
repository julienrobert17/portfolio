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

/**
 * Contact : la démo (cassette vierge « envoie ta tape », procédure en brouillon), l'adresse
 * quand le label l'aura donnée (en attendant, Instagram), les réseaux et disquaires, la
 * newsletter (validation serveur, aucun enregistrement, message honnête).
 */
export default async function ContactPage({ searchParams }: Props) {
  const { newsletter } = await searchParams
  const instagram = label.reseaux.find((r) => r.label === 'Instagram') ?? label.reseaux[0]
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
            <ul className="g2g-liens" style={{ marginTop: 0 }}>
              <li>
                <a href={instagram.url} rel="noopener" className="g2g-bouton--principal">
                  Envoyer le lien sur Instagram
                </a>
              </li>
              <li>
                <Link href={`${routes.label}#demo`}>La procédure de démo</Link>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section className="g2g-section" aria-labelledby="ecrire">
        <h2 id="ecrire" className="g2g-affiche g2g-titre-section">
          Écrire au label
        </h2>
        {label.contact ? (
          <p>
            <a href={`mailto:${label.contact}`}>{label.contact}</a>
          </p>
        ) : (
          <p>Le label n’a pas publié d’adresse e-mail : le message passe par Instagram, et par les disquaires pour les commandes.</p>
        )}
        <ul className="g2g-liens" aria-label="Le label en ligne">
          {label.reseaux.map((l) => (
            <li key={l.url}>
              <a href={l.url} rel="noopener">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <ul className="g2g-liens" aria-label="Disquaires">
          {label.disquaires.map((l) => (
            <li key={l.url}>
              <a href={l.url} rel="noopener">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <Newsletter etat={newsletter} retour={routes.contact} />
    </>
  )
}
