import type { Metadata } from 'next'
import { label } from '@/components/experience/groove-to-grave/content/label'
import { sourcesDuSite } from '@/components/experience/groove-to-grave/lib/sources'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Sources et crédits',
  description: `Les pages publiques d'où viennent les faits, les pochettes et les flyers du site concept ${label.nom}.`,
}

/** Liste simple des sources, groupée par type, titre lisible et domaine plutôt que l'URL brute. */
export default function SourcesPage() {
  const groupes = sourcesDuSite()
  return (
    <>
      <section className="g2g-entete-page" aria-labelledby="sources">
        <TitrePage id="sources" texte="Sources">
          Sources
        </TitrePage>
        <p className="g2g-chapeau">Chaque fait, chaque pochette et chaque flyer du site vient d’une de ces pages publiques. Les œuvres appartiennent à {label.nom} et à leurs auteurs : artwork des vinyles JeunePenard (Cbrgraphics pour GTGR01), compilations et flyers LukasDarian. Instagram n’a jamais été consulté par script.</p>
      </section>
      {(Object.keys(groupes) as (keyof typeof groupes)[]).map((type) =>
        groupes[type].length ? (
          <section key={type} className="g2g-section" aria-labelledby={`src-${type.replace(/\W+/g, '-')}`}>
            <h2 id={`src-${type.replace(/\W+/g, '-')}`} className="g2g-affiche g2g-titre-section">
              {type}
            </h2>
            <ul className="g2g-sources">
              {groupes[type].map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener">
                    {s.titre}
                  </a>
                  <span>{s.domaine}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </>
  )
}
