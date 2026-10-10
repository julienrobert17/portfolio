import type { Metadata } from 'next'
import Link from 'next/link'
import { filtrerSorties, soireesAVenir } from '@/components/experience/groove-to-grave/content'
import { label, textes } from '@/components/experience/groove-to-grave/content/label'
import { dateLongue } from '@/components/experience/groove-to-grave/lib/format'
import { BASE, routes } from '@/components/experience/groove-to-grave/lib/routes'
import BlocSoirees from '@/components/experience/groove-to-grave/sections/bloc-soirees'
import MurSorties from '@/components/experience/groove-to-grave/sections/mur-sorties'
import Newsletter from '@/components/experience/groove-to-grave/sections/newsletter'
import Cassette from '@/components/experience/groove-to-grave/ui/cassette'

export const metadata: Metadata = {
  title: { absolute: `${label.nom} — concept non officiel` },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: label.nom, title: label.nom, description: label.presentation.body, url: BASE },
}

interface Props {
  searchParams: Promise<{ newsletter?: string }>
}

/** Accueil : la dernière sortie en grand, le mur, la prochaine soirée ou l'état vide, la phrase du label, la newsletter. */
export default async function AccueilPage({ searchParams }: Props) {
  const { newsletter } = await searchParams
  const mur = filtrerSorties('tout')
  const derniere = mur[0]
  const prochaine = soireesAVenir()[0]
  return (
    <>
      <section className="g2g-section" aria-labelledby="une">
        <p className="g2g-meta">Dernière sortie · {dateLongue(derniere.releaseDate)}</p>
        <div className="g2g-une">
          <Cassette sortie={derniere} amplitude={0} priorite />
          <div>
            <h1 id="une" className="g2g-affiche g2g-titre">
              {derniere.artistName}
              <br />
              {derniere.title}
            </h1>
            <p className="g2g-sous">
              {derniere.catalog} · {derniere.format}
              {derniere.noRepress ? ' · pressage limité, sans repress' : ''}
            </p>
            {derniere.text ? (
              <p className="g2g-prose" lang={derniere.text.lang}>
                {derniere.text.body.split('\n\n')[0]}
              </p>
            ) : null}
            <ul className="g2g-liens">
              <li>
                <Link href={routes.sortie(derniere.ref)}>La sortie</Link>
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
        <h2 id="mur" className="g2g-affiche">
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
        <h2 id="soirees" className="g2g-affiche">
          Soirées
        </h2>
        <BlocSoirees prochaine={prochaine} />
      </section>
      <section className="g2g-section" aria-label="Le label en une phrase">
        <p className="g2g-marqueur g2g-titre" style={{ transform: 'rotate(-1.5deg)', display: 'inline-block' }}>
          {textes.phrase.body}
          <span className="g2g-brouillon">brouillon</span>
        </p>
        <p className="g2g-sous">
          {label.presentation.body} <Link href={routes.label}>Le label</Link>.
        </p>
      </section>
      <Newsletter etat={newsletter} retour={BASE} />
    </>
  )
}
