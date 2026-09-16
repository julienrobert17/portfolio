import { projets } from '../content/projets'
import { site } from '../content/site'
import { rendreDessin } from '../lib/dessins'
import { formatGps } from '../lib/format'
import DessinSvg from '../ui/dessin-svg'
import LocalTime from './local-time'
import styles from './footer.module.css'

/**
 * Pied de page inversé, pleine hauteur. Le dessin de coupe en bas se tracera
 * à l'entrée dans la vue (Phase 3) ; l'email deviendra magnétique (Phase 4).
 */
export default function Footer() {
  const coupe = projets[0].dessins.find((d) => d.type === 'coupe')
  const dessin = coupe ? rendreDessin(coupe, 1400) : null
  const { contact, reseaux, footer } = site
  return (
    <footer className={`lc-container ${styles.footer}`}>
      <div className={styles.cta}>
        <p className={`lc-display lc-h1 ${styles.titre}`}>{contact.cta}</p>
        <a href={`mailto:${contact.email}`} className={`lc-display lc-h3 ${styles.email}`}>
          {contact.email}
        </a>
      </div>

      <div className={`lc-grid ${styles.colonnes}`}>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Adresse</h2>
          <address className={styles.adresse}>
            {contact.adresse.map((ligne) => (
              <span key={ligne}>{ligne}</span>
            ))}
            <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className="lc-link">
              {contact.telephone}
            </a>
          </address>
          <p className={`lc-mono ${styles.secondaire}`}>{formatGps(contact.gps.lat, contact.gps.lon)}</p>
        </div>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Réseaux</h2>
          <ul className={styles.liste}>
            {reseaux.map((r) => (
              <li key={r.label}>
                <a href={r.href} className="lc-link" rel="noopener noreferrer" target="_blank">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Mentions</h2>
          <ul className={`${styles.liste} ${styles.secondaire}`}>
            {footer.mentions.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Crédits</h2>
          <ul className={`${styles.liste} ${styles.secondaire}`}>
            {footer.credits.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className={`lc-mono ${styles.heure}`}>
            <LocalTime />
          </p>
        </div>
      </div>

      {dessin ? (
        <div className={styles.dessin}>
          <DessinSvg dessin={dessin} encre="paper" />
        </div>
      ) : null}

      <p className={`lc-mono ${styles.copyright}`}>
        © {new Date().getFullYear()} {site.nom}
      </p>
    </footer>
  )
}
