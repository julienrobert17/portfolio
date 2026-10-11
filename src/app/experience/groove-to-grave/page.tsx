import type { Metadata } from 'next'
import Link from 'next/link'
import { MARQUE } from '@/components/experience/groove-to-grave/lib/marque'
import { chargerContenu, filtrerSorties, soireesAVenir } from '@/components/experience/groove-to-grave/sanity/contenu'
import { dateLongue } from '@/components/experience/groove-to-grave/lib/format'
import { BASE, routes } from '@/components/experience/groove-to-grave/lib/routes'
import HerosSoiree from '@/components/experience/groove-to-grave/sections/heros-soiree'
import MurSorties from '@/components/experience/groove-to-grave/sections/mur-sorties'
import Newsletter from '@/components/experience/groove-to-grave/sections/newsletter'
import Cassette from '@/components/experience/groove-to-grave/ui/cassette'

export async function generateMetadata(): Promise<Metadata> {
  const { label } = await chargerContenu()
  return {
    title: { absolute: MARQUE.nom },
    openGraph: { type: 'website', locale: 'fr_FR', siteName: MARQUE.nom, title: MARQUE.nom, description: label.presentation.body, url: BASE },
  }
}

interface Props {
  searchParams: Promise<{ newsletter?: string }>
}

/** Accueil : la dernière sortie en grand, le mur, la prochaine soirée ou l'état vide, la phrase du label, la newsletter. */
export default async function AccueilPage({ searchParams }: Props) {
  const { newsletter } = await searchParams
  const { sorties, soirees, label, textes } = await chargerContenu()
  const mur = filtrerSorties('tout', sorties)
  const derniere = mur[0]
  const prochaine = soireesAVenir(soirees)[0]
  return (
    <>
      <section className="g2g-entete-page" aria-labelledby="une">
        <p className="g2g-meta">Dernière sortie · {dateLongue(derniere.releaseDate)}</p>
        <div className="g2g-une">
          <Cassette sortie={derniere} amplitude={0} />
          <div className="g2g-pile">
            <h1 id="une" className="g2g-affiche g2g-titre-section">
              {derniere.artistName}
              <br />
              {derniere.title}
            </h1>
            <p className="g2g-meta">
              {derniere.catalog} · {derniere.format}
              {derniere.noRepress ? ' · pressage limité, sans repress' : ''}
            </p>
            {derniere.text ? <p lang={derniere.text.lang}>{derniere.text.body.split('\n\n')[0]}</p> : null}
            <ul className="g2g-liens" style={{ marginTop: 0 }}>
              <li>
                <Link href={routes.sortie(derniere.ref)} className="g2g-bouton--principal">
                  La sortie
                </Link>
              </li>
              <li>
                <a href={derniere.links.bandcamp} rel="noopener">
                  Sur Bandcamp
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section className="g2g-section" aria-labelledby="mur">
        <h2 id="mur" className="g2g-affiche g2g-titre-section">
          Le mur
        </h2>
        <MurSorties sorties={mur} />
        <ul className="g2g-liens">
          <li>
            <Link href={routes.sorties}>Toutes les sorties, par genre</Link>
          </li>
        </ul>
      </section>
      <section className="g2g-section" aria-labelledby="soirees">
        <h2 id="soirees" className="g2g-affiche g2g-titre-section">
          Soirées
        </h2>
        <HerosSoiree prochaine={prochaine} lienToutes />
      </section>
      <section className="g2g-section g2g-pile" aria-label="Le label en une phrase">
        <p className="g2g-marqueur g2g-titre-section" style={{ transform: 'rotate(-1.5deg)', display: 'inline-block', maxWidth: 'none' }}>
          {textes.phrase.body}
          <span className="g2g-brouillon">brouillon</span>
        </p>
        <p>
          {label.presentation.body} <Link href={routes.label}>Le label</Link>.
        </p>
      </section>
      <Newsletter etat={newsletter} retour={BASE} />
    </>
  )
}
