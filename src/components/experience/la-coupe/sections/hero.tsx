import MaquetteStatique from '../canvas/maquette-statique'
import { HAUTEUR_COUPE } from '../canvas/maquette'
import { site } from '../content/site'
import styles from './hero.module.css'

/**
 * Hero statique. Phase 2 : le SVG isométrique devient le placeholder d'un
 * canvas R3F ; la section s'épingle sur 300vh et la cote suit la coupe.
 */
export default function Hero() {
  const [ligne1, ligne2] = site.hero.titre
  return (
    <section className={`lc-container ${styles.hero}`} aria-labelledby="hero-titre">
      <p className={`lc-mono ${styles.ligne}`}>{site.hero.ligne}</p>

      <div className={styles.maquette} role="img" aria-label={site.hero.canvasLabel}>
        <MaquetteStatique className={styles.svg} />
      </div>

      <h1 id="hero-titre" className={`lc-display lc-h1 ${styles.titre}`}>
        <span className={styles.titreLigne}>{ligne1}</span>{' '}
        <span className={styles.titreLigne}>{ligne2}</span>
      </h1>

      <p className={`lc-mono ${styles.cote}`} aria-label={`Hauteur de la coupe : 0 mètre sur ${HAUTEUR_COUPE.toFixed(2)}`}>
        <span className="lc-muted">Coupe</span>
        <span className={styles.coteValeur}>0,00 m</span>
      </p>
    </section>
  )
}
