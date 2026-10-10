import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { couleurs, filtrerSorties, getSortie, sorties } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import { dateLongue, duree } from '@/components/experience/groove-to-grave/lib/format'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import { couleurs as tokens } from '@/components/experience/groove-to-grave/tokens'
import BoutonPiste from '@/components/experience/groove-to-grave/ui/bouton-piste'
import Cassette, { pisteJouable } from '@/components/experience/groove-to-grave/ui/cassette'
import Photo, { aPhoto } from '@/components/experience/groove-to-grave/ui/photo'

interface Props {
  params: Promise<{ ref: string }>
}

export function generateStaticParams() {
  return sorties.map((s) => ({ ref: s.ref }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ref } = await params
  const s = getSortie(ref)
  if (!s) return {}
  const description = `${s.catalog}, ${s.artistName}, ${s.title}. ${s.format}, ${dateLongue(s.releaseDate)}, ${label.nom}.`
  return { title: `${s.artistName} — ${s.title}`, description, openGraph: { type: 'music.album', locale: 'fr_FR', siteName: label.nom, title: `${s.artistName} — ${s.title}`, description, url: routes.sortie(s.ref) } }
}

const STATUTS = { disponible: 'Disponible', epuise: 'Vinyle épuisé', numerique: 'Numérique' } as const

/**
 * Fiche d'une sortie : bandeau dans la dominante de la pochette (texte ink ou poster selon le
 * contraste) qui porte le sticker, pochette réelle en grand et intacte, pistes avec durées,
 * texte de sortie dans sa langue, crédits complets, lien Bandcamp, sorties voisines (précédente
 * et suivante dans la série, plus une compilation). Le bouton écouter par piste arrive avec le
 * lecteur, seulement pour les pistes qui ont un extrait.
 */
export default async function SortiePage({ params }: Props) {
  const { ref } = await params
  const s = getSortie(ref)
  if (!s) notFound()
  const c = couleurs[s.ref]
  const fond = c?.dominant ?? tokens.chrome
  const texte = !c || c.contrasteInk.dominant >= 4.5 ? tokens.ink : tokens.poster
  const serie = filtrerSorties('tout').filter((x) => x.kind !== 'compilation')
  const compilations = filtrerSorties('tout').filter((x) => x.kind === 'compilation')
  const i = serie.findIndex((x) => x.ref === s.ref)
  const voisins = s.kind === 'compilation' ? [serie[0], serie[1], ...compilations.filter((x) => x.ref !== s.ref).slice(0, 1)] : [serie[i - 1], serie[i + 1], compilations[0]]
  const liste = voisins.filter((v) => v !== undefined)
  const statut = STATUTS[s.status]
  const aVerifier = s.aVerifier ?? []
  const sticker = s.status === 'epuise' ? { texte: 'épuisé', classe: 'g2g-sticker' } : s.noRepress ? { texte: 'no repress', classe: 'g2g-sticker g2g-sticker--vert' } : null
  return (
    <article>
      <header className="g2g-bandeau" style={{ background: fond, color: texte }}>
        <p className="g2g-meta">
          {s.catalog} · {s.format} · <time dateTime={s.releaseDate}>{dateLongue(s.releaseDate)}</time>
        </p>
        <h1 className="g2g-affiche">
          {s.artistName}
          <br />
          {s.title}
        </h1>
        <p className="g2g-bandeau__statut">
          <span>
            {statut}
            {s.noRepress ? ' · pressage limité, sans repress' : ''}
          </span>
          {sticker ? (
            <span className={sticker.classe} aria-hidden="true">
              {sticker.texte}
            </span>
          ) : null}
        </p>
      </header>
      <div className="g2g-fiche">
        <div>
          {aPhoto(s.ref) ? (
            <figure className="g2g-pochette">
              <Photo id={s.ref} alt={`Pochette de ${s.title} par ${s.artistName}`} sizes="(max-width: 860px) 100vw, 560px" priority />
              <figcaption>
                <span>Artwork : {s.credits.artwork ?? 'à vérifier'}. Œuvre affichée intacte.</span>
              </figcaption>
            </figure>
          ) : (
            <Cassette sortie={s} amplitude={0} />
          )}
        </div>
        <div>
          <h2 className="g2g-affiche g2g-titre-section">Pistes</h2>
          <ol className="g2g-pistes" style={{ marginTop: 'var(--s2)' }}>
            {s.tracks.map((t) => {
              const jouable = pisteJouable(s, t)
              return (
                <li key={t.id}>
                  <span>{t.position}</span>
                  <span>
                    {t.artist ? `${t.artist} — ` : ''}
                    {t.title}
                    {t.digitalOnly ? <span className="g2g-meta"> · bonus numérique</span> : null}
                  </span>
                  <span>{jouable ? <BoutonPiste piste={jouable} /> : null}</span>
                  <span>{duree(t.duration)}</span>
                </li>
              )
            })}
          </ol>
          {s.text ? (
            <div className="g2g-prose" lang={s.text.lang} style={{ marginTop: 'var(--s3)' }}>
              {s.text.body.split(/\n\n+/).map((p, k) => (
                <p key={k}>{p}</p>
              ))}
            </div>
          ) : null}
          <section className="g2g-sous-section" aria-labelledby="credits">
            <h2 id="credits" className="g2g-affiche g2g-titre-section">
              Crédits
            </h2>
            <dl className="g2g-credits">
              {s.artistSlug ? (
                <>
                  <dt>Artiste</dt>
                  <dd>
                    <Link href={routes.artiste(s.artistSlug)}>{s.artistName}</Link>
                  </dd>
                </>
              ) : null}
              {s.credits.artwork ? (
                <>
                  <dt>Artwork</dt>
                  <dd>{s.credits.artwork}</dd>
                </>
              ) : null}
              {s.credits.mastering ? (
                <>
                  <dt>Mastering</dt>
                  <dd>
                    {s.credits.mastering}
                    {aVerifier.some((a) => a.startsWith('credits.mastering')) ? <span className="g2g-brouillon">à vérifier</span> : null}
                  </dd>
                </>
              ) : null}
              {s.credits.ar ? (
                <>
                  <dt>A&amp;R</dt>
                  <dd>{s.credits.ar}</dd>
                </>
              ) : null}
              {s.credits.distribution ? (
                <>
                  <dt>Distribution</dt>
                  <dd>{s.credits.distribution}</dd>
                </>
              ) : null}
              <dt>Genres</dt>
              <dd>
                {s.genres.join(', ')} <span className="g2g-brouillon">déduits</span>
              </dd>
            </dl>
            <ul className="g2g-liens">
              <li>
                <a href={s.links.bandcamp} rel="noopener" className="g2g-bouton--principal">
                  {s.kind === 'vinyle' && s.status === 'disponible' ? 'Acheter le vinyle sur Bandcamp' : 'Sur Bandcamp'}
                </a>
              </li>
              {Object.entries(s.links)
                .filter(([k]) => k !== 'bandcamp')
                .map(([k, url]) => (
                  <li key={k}>
                    <a href={url} rel="noopener">
                      {k === 'deejay' ? 'deejay.de' : k[0].toUpperCase() + k.slice(1)}
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </div>
      {liste.length ? (
        <section className="g2g-section" aria-labelledby="voisins">
          <h2 id="voisins" className="g2g-affiche g2g-titre-section">
            Sorties voisines
          </h2>
          <ul className="g2g-voisins">
            {liste.map((v) => (
              <li key={v.ref}>
                <Cassette sortie={v} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
