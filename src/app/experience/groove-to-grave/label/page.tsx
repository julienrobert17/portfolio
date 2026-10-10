import type { Metadata } from 'next'
import Link from 'next/link'
import { artistes, getArtiste, soirees, sorties } from '@/components/experience/groove-to-grave/content'
import { label, textes } from '@/components/experience/groove-to-grave/content/label'
import { dateLongue } from '@/components/experience/groove-to-grave/lib/format'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'

export const metadata: Metadata = {
  title: 'Le label',
  description: `${label.nom} : qui, pourquoi, chronologie des sorties et des soirées, comment proposer une démo.`,
}

/** Qui (les trois, rôles réels), pourquoi (brouillon), chronologie, démo (brouillon), sources. */
export default function LabelPage() {
  const crew = label.crew.map((s) => getArtiste(s)).filter((a) => a !== undefined)
  const chrono = [
    ...sorties.map((s) => ({ date: s.releaseDate, texte: `${s.catalog} · ${s.artistName}, ${s.title} (${s.format})`, href: routes.sortie(s.ref) })),
    ...soirees.map((s) => ({ date: s.date, texte: `Soirée${s.name ? ` ${s.name}` : ''}, ${s.venue}${s.status === 'annulee' ? ', annulée' : ''}`, href: routes.soirees })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  const sources = Array.from(new Set([...label.sources, ...sorties.flatMap((s) => s.sources), ...artistes.flatMap((a) => a.sources), ...soirees.flatMap((s) => s.sources)]))
  return (
    <>
      <section className="g2g-section" aria-labelledby="qui">
        <h1 id="qui" className="g2g-affiche g2g-titre">
          Le label
        </h1>
        <p className="g2g-prose" lang={label.presentation.lang}>
          {label.presentation.body}
        </p>
        <p className="g2g-sous">
          {label.nom}, {label.ville}, depuis {label.depuis}. Distribution {label.distribution}.
        </p>
        <ul className="g2g-crew">
          {crew.map((a) => (
            <li key={a.slug}>
              <Link href={routes.artiste(a.slug)} className="g2g-affiche" style={{ fontSize: 32, textDecoration: 'none' }}>
                {a.name}
              </Link>
              <p className="g2g-meta">{a.role}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="g2g-section" aria-labelledby="pourquoi">
        <h2 id="pourquoi" className="g2g-affiche">
          Pourquoi <span className="g2g-brouillon">brouillon</span>
        </h2>
        <p className="g2g-prose">{textes.pourquoi.body}</p>
      </section>
      <section className="g2g-section" aria-labelledby="chrono">
        <h2 id="chrono" className="g2g-affiche">
          Chronologie
        </h2>
        <ol className="g2g-chrono">
          {chrono.map((c, i) => (
            <li key={`${c.date}-${i}`}>
              <time dateTime={c.date}>{dateLongue(c.date)}</time>
              <Link href={c.href}>{c.texte}</Link>
            </li>
          ))}
        </ol>
      </section>
      <section className="g2g-section" aria-labelledby="demo">
        <h2 id="demo" className="g2g-affiche">
          Proposer une démo <span className="g2g-brouillon">brouillon</span>
        </h2>
        <p className="g2g-prose">{textes.demo.body}</p>
        <ul className="g2g-liens">
          <li>
            <Link href={routes.contact}>Contact</Link>
          </li>
        </ul>
      </section>
      <section className="g2g-section" aria-labelledby="sources">
        <h2 id="sources" className="g2g-affiche">
          Sources
        </h2>
        <p className="g2g-sous">Chaque fait du site vient d’une de ces pages publiques. Instagram n’a jamais été consulté par script.</p>
        <ul className="g2g-liens">
          {sources.map((u) => (
            <li key={u}>
              <a href={u} rel="noopener">
                {u.replace(/^https?:\/\/(www\.)?/, '').split('/').slice(0, 3).join('/')}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
