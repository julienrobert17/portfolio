import { atelier } from '../content/atelier'
import { imagesAtelier } from '../content/site'
import { imageAtelier } from '../lib/images'
import Photo from '../ui/photo'
import styles from './atelier-intro.module.css'

/** Portrait et texte de présentation. Parallaxe du portrait : Phase 3. */
export default function AtelierIntro() {
  const portrait = imageAtelier('portrait', imagesAtelier.portrait)
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Présentation">
      <div className="lc-grid">
        <div className={styles.portrait}>
          <Photo image={portrait} priority />
        </div>
        <div className={`lc-body ${styles.texte}`}>
          {atelier.texte.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
