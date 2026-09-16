import Link from 'next/link'
import { site } from '../content/site'
import LocalTime from './local-time'
import NavLinks from './nav-links'
import styles from './nav.module.css'

/**
 * Barre fixe en différence sur le fond : encre sur papier, papier sur encre.
 * Réduction au scroll et menu plein écran : Phase 4.
 */
export default function Nav() {
  return (
    <header className={styles.nav}>
      <Link href={site.base} className={styles.nom} aria-label={`${site.nom}, accueil`}>
        <span className={styles.nomLong}>{site.nom}</span>
        <span className={styles.nomCourt} aria-hidden="true">
          {site.initiales}
        </span>
      </Link>
      <nav aria-label="Navigation principale" className={styles.droite}>
        <NavLinks />
        <LocalTime className={`lc-mono ${styles.heure}`} />
      </nav>
    </header>
  )
}
