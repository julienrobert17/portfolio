import type { Metadata } from 'next'
import Link from 'next/link'
import { PRESETS, estPreset, filtrerSorties, type Preset } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import { routes } from '@/components/experience/groove-to-grave/lib/routes'
import MurSorties from '@/components/experience/groove-to-grave/sections/mur-sorties'
import SyncPreset from '@/components/experience/groove-to-grave/sections/sync-preset'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Sorties',
  description: `Toutes les sorties de ${label.nom} : vinyles 12″, EP numérique et compilations Summer Hits, filtrables par genre.`,
}

interface Props {
  searchParams: Promise<{ genre?: string }>
}

/**
 * Le mur, filtrable par les presets : le search param est lu ici, côté serveur, et les presets
 * sont de simples liens de filtre, partageables et fonctionnels sans JavaScript. Le lecteur
 * reçoit l'état par un composant client de page.
 */
export default async function SortiesPage({ searchParams }: Props) {
  const { genre } = await searchParams
  const preset: Preset = estPreset(genre) ? genre : 'tout'
  const liste = filtrerSorties(preset)
  return (
    <section className="g2g-entete-page" aria-labelledby="sorties">
      <SyncPreset preset={preset} />
      <TitrePage id="sorties" texte="Sorties" teinte="rouge">
        Sorties
      </TitrePage>
      <p className="g2g-chapeau">La série GTGR du plus récent au plus ancien, puis les compilations. Les genres sont déduits des textes publics, pas encore validés par le label.</p>
      <ul className="g2g-filtres" aria-label="Filtrer par genre">
        {PRESETS.map((p) => (
          <li key={p}>
            <Link href={p === 'tout' ? routes.sorties : `${routes.sorties}?genre=${p}`} aria-current={p === preset ? 'true' : undefined}>
              {p}
            </Link>
          </li>
        ))}
      </ul>
      <MurSorties sorties={liste} preset={preset} />
    </section>
  )
}
