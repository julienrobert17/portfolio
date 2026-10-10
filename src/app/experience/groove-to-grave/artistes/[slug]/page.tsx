import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { artistes, getArtiste, getSortie } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import Cassette from '@/components/experience/groove-to-grave/ui/cassette'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return artistes.map((a) => ({ slug: a.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const a = getArtiste(slug)
  return a ? { title: a.name, description: `${a.name} sur ${label.nom}${a.city ? `, ${a.city}` : ''}.` } : {}
}

/** Nom, ville, rôle, présentation factuelle tirée des textes publics, sorties sur le label, liens publics. */
export default async function ArtistePage({ params }: Props) {
  const { slug } = await params
  const a = getArtiste(slug)
  if (!a) notFound()
  const sorties = a.releases.map((r) => getSortie(r)).filter((s) => s !== undefined)
  return (
    <article className="g2g-section">
      <p className="g2g-meta">
        {a.role ?? 'Artiste'}
        {a.city ? ` · ${a.city}` : ''}
      </p>
      <h1 className="g2g-affiche g2g-titre">{a.name}</h1>
      {a.presentation ? (
        <p className="g2g-prose" lang={a.presentation.lang}>
          {a.presentation.body}
          {a.presentation.draft ? <span className="g2g-brouillon">brouillon</span> : null}
        </p>
      ) : (
        <p className="g2g-sous">Aucun texte public relevé : seulement le nom et les sorties.</p>
      )}
      <h2 className="g2g-affiche g2g-section">Sur le label</h2>
      <ul className="g2g-voisins">
        {sorties.map((s) => (
          <li key={s.ref}>
            <Cassette sortie={s} />
          </li>
        ))}
      </ul>
      {a.links.length ? (
        <ul className="g2g-liens" aria-label="Liens publics">
          {a.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} rel="noopener">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
