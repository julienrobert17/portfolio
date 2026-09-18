import LienTransition from './lien-transition'
import { site } from '../content/site'
import LocalTime from './local-time'
import MenuBouton from './menu-bouton'
import NavComportement from './nav-comportement'
import NavLinks from './nav-links'
import styles from './nav.module.css'

/**
 * Barre fixe en différence sur le fond : encre sur papier, papier sur encre.
 * Se cache vers le bas, revient vers le haut, initiales après un viewport
 * (NavComportement). Menu plein écran : Phase 4.
 */
export default function Nav() {
  return (
    <header className={styles.nav}>
      <NavComportement />
      {/* Nom accessible d'un seul tenant (« Atelier Mireille Vasseur, accueil ») : le texte visible, nom long ou initiales, est décoratif. */}
      <LienTransition href={site.base} label="Accueil" className={styles.nom}>
        <span className="lc-visually-hidden">{site.nom}, accueil</span>
        <span className={styles.nomLong} aria-hidden="true">
          {site.nom}
        </span>
        <span className={styles.nomCourt} aria-hidden="true">
          {site.initiales}
        </span>
      </LienTransition>
      <nav aria-label="Navigation principale" className={styles.droite}>
        <NavLinks />
        <LocalTime className={`lc-mono ${styles.heure}`} />
        <MenuBouton />
      </nav>
    </header>
  )
}
