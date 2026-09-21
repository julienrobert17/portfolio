import LienTransition from '../layout/lien-transition'
import { imagesAtelier, site } from '../content/site'
import { imageAtelier } from '../lib/images'
import Apparition from '../ui/apparition'
import Photo from '../ui/photo'
import RevealText from '../ui/reveal-text'
import styles from './atelier-teaser.module.css'

export default function AtelierTeaser() {
  const image = imageAtelier('atelier', imagesAtelier.atelier)
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="teaser-titre">
      <div className="lc-grid">
        <Apparition className={styles.photo} bloc>
          <Photo image={image} sizes="(max-width: 900px) 100vw, 50vw" />
        </Apparition>
        <div className={styles.texte}>
          <h2 id="teaser-titre" className="lc-display lc-h2">
            <RevealText as="span" className={styles.titreLigne}>
              {site.atelierTeaser.titre}
            </RevealText>
          </h2>
          <RevealText as="p" className="lc-body" delay={0.1}>
            {site.atelierTeaser.texte}
          </RevealText>
          <LienTransition href={`${site.base}/atelier`} label="Atelier" className={`lc-mono lc-link ${styles.lien}`}>
            {site.atelierTeaser.lien}
          </LienTransition>
        </div>
      </div>
    </section>
  )
}
