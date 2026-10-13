import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MARQUE } from '@/components/experience/groove-to-grave/lib/marque'
import { chargerContenu, getArtiste } from '@/components/experience/groove-to-grave/sanity/contenu'
import type { Piste, Sortie } from '@/components/experience/groove-to-grave/content/types'
import { afficheDeLArtiste, sortiesDeLArtiste } from '@/components/experience/groove-to-grave/lib/artiste'
import { duree } from '@/components/experience/groove-to-grave/lib/format'
import BoutonPiste from '@/components/experience/groove-to-grave/ui/bouton-piste'
import Cassette, { pisteJouable } from '@/components/experience/groove-to-grave/ui/cassette'
import Photo from '@/components/experience/groove-to-grave/ui/photo'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { artistes } = await chargerContenu()
  return artistes.map((a) => ({ slug: a.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const a = getArtiste((await chargerContenu()).artistes, slug)
  return a ? { title: a.name, description: `${a.name} sur ${MARQUE.nom}${a.city ? `, ${a.city}` : ''}.` } : {}
}

/** Pistes d'une compilation signées par l'artiste (seul ou en featuring), d'après le nom de piste. */
function pistesDe(nom: string, sortie: Sortie): Piste[] {
  const n = nom.toLowerCase()
  return sortie.tracks.filter((t) => (t.artist ?? '').toLowerCase().includes(n))
}

/**
 * Page artiste (gabarit unique, Phase 7.7). Elle tient d'abord pour le cas le plus fréquent —
 * une sortie, aucun texte, aucun portrait, aucune piste créditée : affiche scotchée au nom, dans
 * la dominante de l'artiste, et sa cassette. Quand il y a plus à dire, cela s'ajoute dans le même
 * ordre : présentation, œuvre en grand avec sa légende et les liens dessous, puis les sorties en
 * grille, chacune portant ses pistes créditées sous elle. Aucune biographie inventée.
 */
export default async function ArtistePage({ params }: Props) {
  const { slug } = await params
  const contenu = await chargerContenu()
  const a = getArtiste(contenu.artistes, slug)
  if (!a) notFound()
  const sorties = sortiesDeLArtiste(contenu.sorties, slug, a.releases)
  const solo = sorties.find((s) => s.artistSlug === slug && s.pochette)
  // Une seule charte d'en-tête : l'affiche scotchée, dont le papier prend la dominante relevée
  // sur la pochette de l'artiste, avec repli sur la palette si elle ne porte pas l'encre (7.7).
  const affiche = afficheDeLArtiste(a, contenu.sorties)
  const meta = `${a.role ?? 'Artiste'}${a.city ? ` · ${a.city}` : ''}`
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

  return (
    <article className="g2g-entete-page g2g-artiste">
      <p className="g2g-meta">{meta}</p>
      <TitrePage texte={a.name} couleur={affiche.couleur}>
        {a.name}
      </TitrePage>
      {sorties.length ? (
        <p className="g2g-bandeau__statut">
          <span>
            {sorties.length} {sorties.length > 1 ? 'sorties' : 'sortie'} sur le label · {sorties.map((s) => s.catalog).join(', ')}
          </span>
        </p>
      ) : null}
      {a.presentation ? (
        <p className="g2g-chapeau" lang={a.presentation.lang}>
          {a.presentation.body}
          {a.presentation.draft ? <span className="g2g-brouillon">brouillon</span> : null}
        </p>
      ) : null}
      {/* L'œuvre en grand quand l'artiste a une sortie solo illustrée ; les liens tiennent sous sa
          légende, dans la même colonne, pour que rien ne reste seul à côté. */}
      {solo?.pochette ? (
        <div className="g2g-oeuvre">
          <figure className="g2g-pochette">
            <Photo image={solo.pochette} alt={`Pochette de ${solo.title}`} sizes="(max-width: 860px) 100vw, 560px" priority />
            <figcaption>
              <span>
                {solo.catalog} · {solo.title}
                {solo.credits.artwork ? ` · artwork : ${solo.credits.artwork}` : ''}. Œuvre affichée intacte.
              </span>
            </figcaption>
          </figure>
          {liens}
        </div>
      ) : (
        liens
      )}
      {sorties.length ? (
        <section className="g2g-section" aria-labelledby="sur-le-label">
          <h2 id="sur-le-label" className="g2g-affiche g2g-titre-section">
            Sur le label
          </h2>
          <ul className="g2g-sorties-artiste">
            {sorties.map((s) => {
              const pistes = pistesDe(a.name, s)
              return (
                <li key={s.ref}>
                  <Cassette sortie={s} amplitude={2} />
                  {/* Pas de piste créditée : la cassette reste seule, sans ligne ni filet. */}
                  {pistes.length ? (
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
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
