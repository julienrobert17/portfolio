import type { Preset, Sortie } from '../content'
import Cassette from '../ui/cassette'

interface MurProps {
  sorties: Sortie[]
  preset?: Preset
  titre?: string
}

/** Le mur de cassettes : une liste, ordre du DOM = ordre de lecture, nombre de résultats annoncé. */
export default function MurSorties({ sorties, preset = 'tout', titre }: MurProps) {
  return (
    <div>
      <p className="g2g-meta g2g-mur-compte" role="status">
        {sorties.length} {sorties.length > 1 ? 'sorties' : 'sortie'}
        {preset !== 'tout' ? ` pour ${preset}` : ''}
        {titre ? ` · ${titre}` : ''}
      </p>
      <ul className="g2g-mur">
        {sorties.map((s) => (
          <li key={s.ref}>
            <Cassette sortie={s} />
          </li>
        ))}
      </ul>
    </div>
  )
}
