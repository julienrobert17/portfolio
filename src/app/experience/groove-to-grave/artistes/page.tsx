import type { Metadata } from 'next'
import Link from 'next/link'
import { MARQUE } from '@/components/experience/groove-to-grave/lib/marque'
import { chargerContenu } from '@/components/experience/groove-to-grave/sanity/contenu'
import { tonsDeLArtiste } from '@/components/experience/groove-to-grave/lib/artiste'
import { rotation } from '@/components/experience/groove-to-grave/lib/desordre'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Artistes',
  description: `Le crew, les artistes signés et les invités des compilations de ${MARQUE.nom}.`,
}

/** Les noms en typographie d'affiche collée, un par affiche, le crew d'abord. */
export default async function ArtistesPage() {
  const { artistes, sorties } = await chargerContenu()
  return (
    <section className="g2g-entete-page" aria-labelledby="artistes">
      <TitrePage id="artistes" texte="Artistes" teinte="vert">
        Artistes
      </TitrePage>
      <p className="g2g-chapeau">Le crew, les artistes signés, puis les invités des compilations. Présentations tirées des textes publics, rien d’inventé.</p>
      <ul className="g2g-affiches" style={{ marginTop: 'var(--s4)' }}>
        {/* Une seule source de teinte : la dominante de l'artiste, ici au seuil du petit texte (7.9). */}
        {artistes.map((a) => (
          <li key={a.slug}>
            <Link
              href={routes.artiste(a.slug)}
              className="g2g-affiche g2g-affiche-lien"
              data-collage=""
              style={
                {
                  '--rot-base': `${rotation(a.slug, 4)}deg`,
                  '--papier-affiche': tonsDeLArtiste(a, sorties).tuile.couleur,
                  '--encre-affiche': tonsDeLArtiste(a, sorties).tuile.encre,
                } as React.CSSProperties
              }
            >
              {a.name}
              <small>{a.role ?? (a.city ? a.city : `${a.releases.length} ${a.releases.length > 1 ? 'sorties' : 'sortie'}`)}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
