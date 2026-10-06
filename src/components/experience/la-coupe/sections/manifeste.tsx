import { site } from '../content/site'
import RichText from '../ui/rich-text'
import Compteurs from './compteurs'
import styles from './manifeste.module.css'

/** Trois phrases révélées par lignes, trois chiffres qui s'incrémentent une fois. */
export default function Manifeste() {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="manifeste-titre">
      <h2 id="manifeste-titre" className="lc-visually-hidden">
        Manifeste
      </h2>
      <div className="lc-grid">
        <div className={styles.phrases}>
          {site.manifeste.map((phrase) => (
            <RichText key={phrase} text={phrase} className={`lc-lead ${styles.phrase}`} reveal />
          ))}
        </div>
        <dl className={styles.chiffres}>
          <Compteurs />
          {site.chiffres.map((c) => (
            <div key={c.unite} className={styles.chiffre}>
              <dd className={`lc-mono ${styles.valeur}`} data-valeur={c.valeur}>
                {c.valeur}
              </dd>
              <dt className={`lc-mono lc-muted ${styles.unite}`}>{c.unite}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
