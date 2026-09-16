import { site } from '../content/site'
import RichText from '../ui/rich-text'
import styles from './manifeste.module.css'

/** Trois phrases et trois chiffres. Révélation par lignes et compteurs : Phase 3. */
export default function Manifeste() {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="manifeste-titre">
      <h2 id="manifeste-titre" className="lc-visually-hidden">
        Manifeste
      </h2>
      <div className="lc-grid">
        <div className={styles.phrases}>
          {site.manifeste.map((phrase) => (
            <RichText key={phrase} text={phrase} className={`lc-lead ${styles.phrase}`} />
          ))}
        </div>
        <dl className={styles.chiffres}>
          {site.chiffres.map((c) => (
            <div key={c.unite} className={styles.chiffre}>
              <dd className={`lc-mono ${styles.valeur}`}>{c.valeur}</dd>
              <dt className={`lc-mono lc-muted ${styles.unite}`}>{c.unite}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
