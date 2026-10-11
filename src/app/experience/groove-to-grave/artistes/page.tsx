import type { Metadata } from 'next'
import Link from 'next/link'
import { MARQUE } from '@/components/experience/groove-to-grave/lib/marque'
import { chargerContenu } from '@/components/experience/groove-to-grave/sanity/contenu'
import { rotation } from '@/components/experience/groove-to-grave/lib/desordre'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Artistes',
  description: `Le crew, les artistes signés et les invités des compilations de ${MARQUE.nom}.`,
}

/** Quatre variantes d'affiche : poster, red et green avec texte ink, ink avec texte poster (paires vérifiées par tokens.test.ts). */
const TEINTES = ['', 'g2g-affiche-lien--rouge', 'g2g-affiche-lien--vert', 'g2g-affiche-lien--encre']

/** Les noms en typographie d'affiche collée, un par affiche, le crew d'abord. */
export default async function ArtistesPage() {
  const { artistes } = await chargerContenu()
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
