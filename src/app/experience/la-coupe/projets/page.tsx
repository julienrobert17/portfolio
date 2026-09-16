import type { Metadata } from 'next'
import { categories, projets } from '@/components/experience/la-coupe/content'
import type { Categorie } from '@/components/experience/la-coupe/content/types'
import EntetePage from '@/components/experience/la-coupe/sections/entete-page'
import FiltresIndex, { type Vue } from '@/components/experience/la-coupe/sections/filtres-index'
import GrilleProjets from '@/components/experience/la-coupe/sections/grille-projets'
import IndexProjets from '@/components/experience/la-coupe/sections/index-projets'

export const metadata: Metadata = {
  title: 'Projets',
  description: 'Les huit projets de l’atelier : maisons, équipements publics, logements, réhabilitations.',
}

type Params = Record<string, string | string[] | undefined>

function premier(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** L'état (vue, filtre) vit dans l'URL : la page fonctionne sans JavaScript. */
export default async function ProjetsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const vue: Vue = premier(params.vue) === 'grille' ? 'grille' : 'liste'
  const demande = premier(params.programme)
  const categorie = categories.find((c) => c === demande) ?? null
  const filtres = categorie ? projets.filter((p) => p.categorie === (categorie as Categorie)) : projets

  return (
    <>
      <EntetePage surtitre={`${projets.length} projets — 2011 à aujourd’hui`} titre="Projets" />
      <div className="lc-container" style={{ paddingBottom: 'var(--s-8)' }}>
        <FiltresIndex vue={vue} categorie={categorie} />
        <div style={{ paddingTop: 'var(--s-6)' }}>
          {vue === 'grille' ? <GrilleProjets projets={filtres} /> : <IndexProjets projets={filtres} nu />}
        </div>
      </div>
    </>
  )
}
