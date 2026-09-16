import { atelier } from '../content/atelier'
import styles from './methode.module.css'

/**
 * Trois temps, trois petits dessins au trait (relevé, calques, appareillage).
 * Tracé au scroll : Phase 3.
 */
const DESSINS: Record<string, string> = {
  ecouter: 'M4 52H92M20 52V24M20 24h-4l4-6 4 6h-4M60 52V36h18v16M60 44h18',
  dessiner: 'M12 20h48v28H12ZM24 28h48v28H24ZM36 36h48v-4M36 36v20',
  construire: 'M8 56h80M8 44h80M8 32h80M8 20h80M24 20v12M56 20v12M40 32v12M72 32v12M24 44v12M56 44v12',
}

export default function Methode() {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="methode-titre">
      <h2 id="methode-titre" className={`lc-mono ${styles.titre}`}>
        Méthode
      </h2>
      <ol className={`lc-grid ${styles.temps}`}>
        {atelier.methode.map((t, i) => (
          <li key={t.id} className={styles.temp}>
            <svg viewBox="0 0 96 64" className={styles.dessin} aria-hidden="true" focusable="false">
              <path d={DESSINS[t.id]} fill="none" stroke="var(--ink)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
            <p className="lc-mono lc-muted">0{i + 1}</p>
            <h3 className="lc-display lc-h3">{t.titre}</h3>
            <p className={styles.texte}>{t.texte}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
