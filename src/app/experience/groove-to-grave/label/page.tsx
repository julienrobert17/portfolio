import type { Metadata } from 'next'
import Link from 'next/link'
import { getArtiste, soirees, sorties } from '@/components/experience/groove-to-grave/content'
import { label, textes } from '@/components/experience/groove-to-grave/content/label'
import { dateLongue } from '@/components/experience/groove-to-grave/lib/format'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Le label',
  description: `${label.nom} : qui, pourquoi, chronologie des sorties et des soirées, comment proposer une démo.`,
}

/** Qui (les trois, rôles réels), pourquoi (brouillon), chronologie, démo (brouillon). Les sources ont leur page. */
export default function LabelPage() {
  const crew = label.crew.map((s) => getArtiste(s)).filter((a) => a !== undefined)
  const chrono = [
    ...sorties.map((s) => ({ date: s.releaseDate, texte: `${s.catalog} · ${s.artistName}, ${s.title} (${s.format})`, href: routes.sortie(s.ref) })),
    ...soirees.map((s) => ({ date: s.date, texte: `Soirée${s.name ? ` ${s.name}` : ''}, ${s.venue}${s.status === 'annulee' ? ', annulée' : ''}`, href: routes.soirees })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <section className="g2g-entete-page" aria-labelledby="qui">
        <TitrePage id="qui" texte="Le label" teinte="vert">
          Le label
        </TitrePage>
        <p className="g2g-chapeau" lang={label.presentation.lang}>
          {label.presentation.body}
        </p>
        <p className="g2g-meta" style={{ marginTop: 'var(--s2)' }}>
          {label.nom}, {label.ville}, depuis {label.depuis} · distribution {label.distribution}
        </p>
        <ul className="g2g-crew" style={{ marginTop: 'var(--s4)' }}>
          {crew.map((a) => (
            <li key={a.slug}>
              <Link href={routes.artiste(a.slug)} className="g2g-affiche">
                {a.name}
              </Link>
              <p className="g2g-meta">{a.role}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="g2g-section" aria-labelledby="pourquoi">
        <h2 id="pourquoi" className="g2g-affiche g2g-titre-section">
          Pourquoi <span className="g2g-brouillon">brouillon</span>
        </h2>
        <p>{textes.pourquoi.body}</p>
      </section>
      <section className="g2g-section" aria-labelledby="chrono">
        <h2 id="chrono" className="g2g-affiche g2g-titre-section">
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
        <h2 id="demo" className="g2g-affiche g2g-titre-section">
          Proposer une démo <span className="g2g-brouillon">brouillon</span>
        </h2>
        <p>{textes.demo.body}</p>
        <ul className="g2g-liens">
          <li>
            <Link href={routes.contact} className="g2g-bouton--principal">
              Contact
            </Link>
          </li>
          <li>
            <Link href={routes.sources}>Sources et crédits</Link>
          </li>
        </ul>
      </section>
    </>
  )
}
