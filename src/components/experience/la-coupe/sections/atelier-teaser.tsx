import Link from 'next/link'
import { imagesAtelier, site } from '../content/site'
import { imageAtelier } from '../lib/images'
import Photo from '../ui/photo'
import styles from './atelier-teaser.module.css'

export default function AtelierTeaser() {
  const image = imageAtelier('atelier', imagesAtelier.atelier)
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="teaser-titre">
      <div className="lc-grid">
        <div className={styles.photo}>
          <Photo image={image} />
        </div>
        <div className={styles.texte}>
          <h2 id="teaser-titre" className={`lc-display lc-h2`}>
            {site.atelierTeaser.titre}
          </h2>
          <p className="lc-body">{site.atelierTeaser.texte}</p>
          <Link href={`${site.base}/atelier`} className={`lc-mono lc-link ${styles.lien}`}>
            {site.atelierTeaser.lien}
          </Link>
        </div>
      </div>
    </section>
  )
}
