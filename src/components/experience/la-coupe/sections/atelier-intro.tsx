import { atelier } from '../content/atelier'
import { imagesAtelier } from '../content/site'
import { imageAtelier } from '../lib/images'
import ParallaxePortrait from '../ui/parallaxe-portrait'
import Photo from '../ui/photo'
import RevealText from '../ui/reveal-text'
import styles from './atelier-intro.module.css'

/** Portrait en parallaxe (8 %, scrub) et texte de présentation révélé par lignes. */
export default function AtelierIntro() {
  const portrait = imageAtelier('portrait', imagesAtelier.portrait)
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Présentation">
      <div className="lc-grid">
        <div className={styles.portrait}>
          {/* Le cadre réserve la taille (ratio de la photo) et masque le débord de la parallaxe. */}
          <div className={styles.cadre} style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}>
            <Photo image={portrait} eager sizes="(max-width: 900px) 100vw, 42vw" />
            <ParallaxePortrait />
          </div>
        </div>
        <div className={`lc-body ${styles.texte}`}>
          {atelier.texte.map((p) => (
            <RevealText key={p} as="p">
              {p}
            </RevealText>
          ))}
        </div>
      </div>
    </section>
  )
}
