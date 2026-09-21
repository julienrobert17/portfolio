import MaquetteStatique from '../canvas/maquette-statique'
import { HAUTEUR_COUPE } from '../canvas/maquette'
import { site } from '../content/site'
import { formatMetres } from '../lib/format'
import HeroScroll from './hero-scroll'
import styles from './hero.module.css'

/**
 * Hero : le SVG axonométrique est le placeholder du canvas R3F (fondu croisé
 * à la première frame) et son repli sans WebGL ou sous mouvement réduit.
 */
export default function Hero() {
  const [ligne1, ligne2] = site.hero.titre
  return (
    <section className={styles.hero} aria-labelledby="hero-titre">
      {/* Collant sur toute la hauteur de la section : la coupe se déroule sans pin ScrollTrigger. */}
      <div className={`lc-container ${styles.scene}`} data-hero="scene">
      <p className={`lc-mono ${styles.ligne}`}>{site.hero.ligne}</p>

      <p className="lc-visually-hidden">{site.hero.canvasLabel}</p>
      <div className={styles.maquette} data-hero="maquette" aria-hidden="true">
        <MaquetteStatique className={styles.svg} />
      </div>
      <HeroScroll />

      <h1 id="hero-titre" className={`lc-display lc-h1 ${styles.titre}`} data-hero="titre">
        <span className={styles.titreLigne}>{ligne1}</span>{' '}
        <span className={styles.titreLigne}>{ligne2}</span>
      </h1>

      <p className={`lc-mono ${styles.cote}`}>
        <span className="lc-visually-hidden">Cote de la </span>
        <span className="lc-muted">Coupe</span>
        <span className={styles.coteValeur} data-hero="cote">
          {formatMetres(HAUTEUR_COUPE)}
        </span>
      </p>
      </div>
    </section>
  )
}
