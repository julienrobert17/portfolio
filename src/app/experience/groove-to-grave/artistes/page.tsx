import type { Metadata } from 'next'
import Link from 'next/link'
import { artistes } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import { rotation } from '@/components/experience/groove-to-grave/lib/desordre'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Artistes',
  description: `Le crew, les artistes signés et les invités des compilations de ${label.nom}.`,
}

/** Quatre variantes d'affiche : poster, red et green avec texte ink, ink avec texte poster (paires vérifiées par tokens.test.ts). */
const TEINTES = ['', 'g2g-affiche-lien--rouge', 'g2g-affiche-lien--vert', 'g2g-affiche-lien--encre']

/** Les noms en typographie d'affiche collée, un par affiche, le crew d'abord. */
export default function ArtistesPage() {
  return (
    <section className="g2g-entete-page" aria-labelledby="artistes">
      <TitrePage id="artistes" texte="Artistes" teinte="vert">
        Artistes
      </TitrePage>
      <p className="g2g-chapeau">Le crew, les artistes signés, puis les invités des compilations. Présentations tirées des textes publics, rien d’inventé.</p>
      <ul className="g2g-affiches" style={{ marginTop: 'var(--s4)' }}>
        {artistes.map((a, i) => (
          <li key={a.slug}>
            <Link href={routes.artiste(a.slug)} className={`g2g-affiche g2g-affiche-lien ${TEINTES[i % TEINTES.length]}`} data-collage="" style={{ '--rot-base': `${rotation(a.slug, 4)}deg` } as React.CSSProperties}>
              {a.name}
              <small>{a.role ?? (a.city ? a.city : `${a.releases.length} ${a.releases.length > 1 ? 'sorties' : 'sortie'}`)}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
