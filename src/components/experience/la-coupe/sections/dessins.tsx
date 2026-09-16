import type { Projet } from '../content/types'
import { rendreDessin } from '../lib/dessins'
import { formatNumero } from '../lib/format'
import DessinSvg from '../ui/dessin-svg'
import styles from './dessins.module.css'

interface DessinsProps {
  projet: Projet
}

/** Plan et coupe sur fond calque. Tracé au scroll et cotes différées : Phase 3. */
export default function Dessins({ projet }: DessinsProps) {
  if (projet.dessins.length === 0) return null
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Dessins">
      <div className={`lc-grid ${styles.grille}`}>
        {projet.dessins.map((d, i) => (
          <div key={d.legende} className={styles.dessin}>
            <DessinSvg dessin={rendreDessin(d)} numero={formatNumero(i)} />
          </div>
        ))}
      </div>
    </section>
  )
}
