import { site } from '../content/site'
import { formatGps } from '../lib/format'
import Apparition from '../ui/apparition'
import ContactPlan from './contact-plan'
import ContactSection from './contact-section'
import styles from './contact-venir.module.css'

/** « Venir à l'atelier » : table mono (adresse, accès, horaires, métro, GPS) dans le rail, plan de situation tracé au scroll à côté. */
export default function ContactVenir() {
  const { contact } = site
  const { venir } = contact
  const { lat, lon } = contact.gps
  const carte = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
  return (
    <ContactSection
      numero="02"
      titre={venir.titre}
      rail={
        <Apparition as="dl" className={`lc-mono ${styles.table}`}>
          <div className={styles.ligne}>
            <dt className="lc-muted">{venir.libelles.adresse}</dt>
            <dd className={styles.valeur}>
              {contact.adresse.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">{venir.libelles.acces}</dt>
            <dd className={styles.valeur}>{venir.acces}</dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">{venir.libelles.horaires}</dt>
            <dd className={styles.valeur}>{contact.horaires}</dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">{venir.libelles.telephone}</dt>
            <dd className={styles.valeur}>
              <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className={`lc-link ${styles.lien}`}>
                {contact.telephone}
              </a>
            </dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">{venir.libelles.metro}</dt>
            <dd className={styles.valeur}>
              {venir.stations.map((s) => (
                <span key={s.id}>
                  {s.nom}, {s.ligne}, {s.marche}
                </span>
              ))}
            </dd>
          </div>
          <div className={styles.ligne}>
            <dt className="lc-muted">{venir.libelles.gps}</dt>
            <dd className={styles.valeur}>
              <span>{formatGps(lat, lon)}</span>
              <a href={carte} target="_blank" rel="noopener noreferrer" className={`lc-link ${styles.lien}`}>
                {venir.carte}
              </a>
            </dd>
          </div>
        </Apparition>
      }
    >
      <ContactPlan />
    </ContactSection>
  )
}
