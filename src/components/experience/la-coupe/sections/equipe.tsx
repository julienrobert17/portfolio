import { atelier } from '../content/atelier'
import { imagesAtelier } from '../content/site'
import { imageAtelier } from '../lib/images'
import Photo from '../ui/photo'
import styles from './equipe.module.css'

/** Liste typographique. La vignette est toujours visible : rien n'est réservé au survol. */
export default function Equipe() {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="equipe-titre">
      <h2 id="equipe-titre" className={`lc-mono ${styles.titre}`}>
        Équipe
      </h2>
      <ul className={styles.liste}>
        {atelier.equipe.map((m) => {
          const contenu = imagesAtelier[m.photo]
          const photo = contenu ? imageAtelier(m.photo, contenu) : null
          return (
            <li key={m.nom} className={styles.membre}>
              {photo ? (
                <span className={styles.vignette}>
                  <Photo image={photo} />
                </span>
              ) : null}
              <span className={`lc-display lc-h3 ${styles.nom}`}>{m.nom}</span>{' '}
              <span className={`lc-mono lc-muted ${styles.role}`}>{m.role}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
