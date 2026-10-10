import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { artistes, getArtiste, getSortie } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import type { Sortie } from '@/components/experience/groove-to-grave/content/types'
import Bandeau from '@/components/experience/groove-to-grave/ui/bandeau'
import Cassette from '@/components/experience/groove-to-grave/ui/cassette'
import Photo, { aPhoto } from '@/components/experience/groove-to-grave/ui/photo'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

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

/** Sorties d'un artiste sur le label : ses sorties solo d'abord, les plus récentes en tête, puis les compilations où il signe une piste. */
function sortiesDe(slug: string, refs: string[]): Sortie[] {
  const liste = refs.map((r) => getSortie(r)).filter((s) => s !== undefined)
  const rang = (s: Sortie) => (s.artistSlug === slug ? 0 : 1)
  return liste.sort((a, b) => rang(a) - rang(b) || b.releaseDate.localeCompare(a.releaseDate))
}

/**
 * Page artiste : nom, ville, rôle, présentation factuelle tirée des textes publics, sorties sur
 * le label, liens publics. Avec une sortie sur le label, la page reprend la pochette en grand
 * et le bandeau de tête dans sa dominante, comme la page sortie (la sortie solo la plus
 * récente, sinon la compilation la plus récente où l'artiste signe une piste). Aucune
 * biographie inventée.
 */
export default async function ArtistePage({ params }: Props) {
  const { slug } = await params
  const a = getArtiste(slug)
  if (!a) notFound()
  const sorties = sortiesDe(slug, a.releases)
  const une = sorties.find((s) => aPhoto(s.ref))
  const meta = `${a.role ?? 'Artiste'}${a.city ? ` · ${a.city}` : ''}`
  const presentation = a.presentation ? (
    <p className="g2g-chapeau" lang={a.presentation.lang}>
      {a.presentation.body}
      {a.presentation.draft ? <span className="g2g-brouillon">brouillon</span> : null}
    </p>
  ) : (
    <p className="g2g-chapeau">Aucun texte public relevé : seulement le nom et les sorties.</p>
  )
  const liens = a.links.length ? (
    <ul className="g2g-liens" aria-label="Liens publics">
      {a.links.map((l) => (
        <li key={l.url}>
          <a href={l.url} rel="noopener">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  ) : null
  const surLeLabel = (
    <section className="g2g-section" aria-labelledby="sur-le-label">
      <h2 id="sur-le-label" className="g2g-affiche g2g-titre-section">
        Sur le label
      </h2>
      <ul className="g2g-voisins">
        {sorties.map((s) => (
          <li key={s.ref}>
            <Cassette sortie={s} />
          </li>
        ))}
      </ul>
    </section>
  )

  if (!une) {
    return (
      <article className="g2g-entete-page">
        <p className="g2g-meta">{meta}</p>
        <TitrePage texte={a.name}>{a.name}</TitrePage>
        {presentation}
        {liens}
        {sorties.length ? surLeLabel : null}
      </article>
    )
  }

  const solo = une.artistSlug === slug
  return (
    <article>
      <Bandeau sortieRef={une.ref}>
        <p className="g2g-meta">{meta}</p>
        <h1 className="g2g-affiche">{a.name}</h1>
        <p className="g2g-bandeau__statut">
          <span>
            {sorties.length} {sorties.length > 1 ? 'sorties' : 'sortie'} sur le label · {sorties.map((s) => s.catalog).join(', ')}
          </span>
        </p>
      </Bandeau>
      <div className="g2g-fiche">
        <figure className="g2g-pochette">
          <Photo id={une.ref} alt={`Pochette de ${une.title}${solo ? '' : ` par ${une.artistName}`}`} sizes="(max-width: 860px) 100vw, 560px" priority />
          <figcaption>
            <span>
              {une.catalog} · {une.title}
              {solo ? '' : `, ${une.artistName}`} · artwork : {une.credits.artwork ?? 'à vérifier'}. Œuvre affichée intacte.
            </span>
          </figcaption>
        </figure>
        <div>
          {presentation}
          {liens}
        </div>
      </div>
      {surLeLabel}
    </article>
  )
}
