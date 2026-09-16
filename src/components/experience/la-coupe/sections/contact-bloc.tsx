import { site } from '../content/site'
import { formatGps } from '../lib/format'
import styles from './contact-bloc.module.css'

/** Coordonnées : email en grand, téléphone, adresse, horaires, GPS. */
export default function ContactBloc() {
  const { contact } = site
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Coordonnées">
      <div className="lc-grid">
        <div className={styles.principal}>
          <a href={`mailto:${contact.email}`} className={`lc-display lc-h2 ${styles.email}`}>
            {contact.email}
          </a>
          <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className={`lc-mono lc-link ${styles.tel}`}>
            {contact.telephone}
          </a>
        </div>
        <dl className={`lc-mono ${styles.details}`}>
          <div className={styles.ligne}>
            <dt className="lc-muted">Adresse</dt>
            <dd className={styles.valeur}>
              {contact.adresse.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">Horaires</dt>
            <dd className={styles.valeur}>{contact.horaires}</dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">Coordonnées</dt>
            <dd className={styles.valeur}>{formatGps(contact.gps.lat, contact.gps.lon)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
