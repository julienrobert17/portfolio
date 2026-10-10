import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { artistes, getArtiste, getSortie } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import type { Piste, Sortie } from '@/components/experience/groove-to-grave/content/types'
import { duree } from '@/components/experience/groove-to-grave/lib/format'
import Bandeau from '@/components/experience/groove-to-grave/ui/bandeau'
import BoutonPiste from '@/components/experience/groove-to-grave/ui/bouton-piste'
import Cassette, { pisteJouable } from '@/components/experience/groove-to-grave/ui/cassette'
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

/** Pistes d'une compilation signées par l'artiste (seul ou en featuring), d'après le nom de piste. */
function pistesDe(nom: string, sortie: Sortie): Piste[] {
  const n = nom.toLowerCase()
  return sortie.tracks.filter((t) => (t.artist ?? '').toLowerCase().includes(n))
}

/**
 * Page artiste : nom, ville ou rôle, présentation factuelle tirée des textes publics quand il y
 * en a une (rien d'autre sinon), sorties sur le label, liens publics. Aucune biographie inventée,
 * aucun message interne. Avec une sortie solo illustrée, la page reprend la pochette en grand et
 * le bandeau dans sa dominante comme la page sortie. Un invité de compilation garde le titre en
 * bande de papier, puis la cassette de la compilation et la ligne de son morceau.
 */
export default async function ArtistePage({ params }: Props) {
  const { slug } = await params
  const a = getArtiste(slug)
  if (!a) notFound()
  const sorties = sortiesDe(slug, a.releases)
  const solo = sorties.find((s) => s.artistSlug === slug && aPhoto(s.ref))
  const meta = `${a.role ?? 'Artiste'}${a.city ? ` · ${a.city}` : ''}`
  const presentation = a.presentation ? (
    <p className="g2g-chapeau" lang={a.presentation.lang}>
      {a.presentation.body}
      {a.presentation.draft ? <span className="g2g-brouillon">brouillon</span> : null}
    </p>
  ) : null
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

  if (solo) {
    return (
      <article>
        <Bandeau sortieRef={solo.ref}>
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
            <Photo id={solo.ref} alt={`Pochette de ${solo.title}`} sizes="(max-width: 860px) 100vw, 560px" priority />
            <figcaption>
              <span>
                {solo.catalog} · {solo.title} · artwork : {solo.credits.artwork ?? 'à vérifier'}. Œuvre affichée intacte.
              </span>
            </figcaption>
          </figure>
          <div>
            {presentation}
            {liens}
          </div>
        </div>
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
      </article>
    )
  }

  return (
    <article className="g2g-entete-page">
      <p className="g2g-meta">{meta}</p>
      <TitrePage texte={a.name}>{a.name}</TitrePage>
      {sorties.length ? (
        <p className="g2g-bandeau__statut">
          <span>
            {sorties.length} {sorties.length > 1 ? 'compilations' : 'compilation'} sur le label · {sorties.map((s) => s.catalog).join(', ')}
          </span>
        </p>
      ) : null}
      {presentation}
      {liens}
      {sorties.length ? (
        <section className="g2g-section" aria-labelledby="sur-le-label">
          <h2 id="sur-le-label" className="g2g-affiche g2g-titre-section">
            Sur le label
          </h2>
          <ul className="g2g-participations">
            {sorties.map((s) => {
              const pistes = pistesDe(a.name, s)
              return (
                <li key={s.ref}>
                  <Cassette sortie={s} />
                  <ol className="g2g-pistes" aria-label={`Morceaux de ${a.name} sur ${s.catalog}`}>
                    {pistes.map((t) => {
                      const jouable = pisteJouable(s, t)
                      return (
                        <li key={t.id}>
                          <span>{t.position}</span>
                          <span>
                            {t.title}
                            {t.artist && t.artist.toLowerCase() !== a.name.toLowerCase() ? <span className="g2g-meta"> · {t.artist}</span> : null}
                          </span>
                          <span>{jouable ? <BoutonPiste piste={jouable} /> : null}</span>
                          <span>{duree(t.duration)}</span>
                        </li>
                      )
                    })}
                  </ol>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
