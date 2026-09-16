import { atelier } from '../content/atelier'
import type { Distinction } from '../content/types'
import styles from './distinctions.module.css'

function Liste({ titre, items }: { titre: string; items: Distinction[] }) {
  return (
    <div className={styles.colonne}>
      <h2 className={`lc-mono ${styles.titre}`}>{titre}</h2>
      <ul className={styles.liste}>
        {items.map((d) => (
          <li key={d.label} className={styles.item}>
            <span className="lc-mono">{d.annee}</span>
            <span className={styles.label}>{d.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Distinctions et publications, deux listes mono par année. */
export default function Distinctions() {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-label="Distinctions et publications">
      <div className="lc-grid">
        <Liste titre="Distinctions" items={atelier.distinctions} />
        <Liste titre="Publications" items={atelier.publications} />
      </div>
    </section>
  )
}
