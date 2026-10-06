import { site } from '../content/site'
import { formatNumero } from '../lib/format'
import Apparition from '../ui/apparition'
import RichText from '../ui/rich-text'
import ContactSection from './contact-section'
import styles from './contact-etapes.module.css'

/** « Comment ça commence » : trois étapes numérotées en mono, numéro et titre en entrée standard, la phrase révélée par lignes. */
export default function ContactEtapes() {
  const { etapes } = site.contact
  return (
    <ContactSection numero="03" titre={etapes.titre}>
      <Apparition as="ol" className={styles.liste} selecteur="[data-entree]">
        {etapes.liste.map((e, i) => (
          <li key={e.id} className={styles.etape}>
            <p className={`lc-mono lc-muted ${styles.numero}`} data-entree>
              {formatNumero(i)}
            </p>
            <h3 className={`lc-mono ${styles.titre}`} data-entree>
              {e.titre}
            </h3>
            <RichText text={e.texte} reveal className={`lc-lead ${styles.texte}`} />
          </li>
        ))}
      </Apparition>
    </ContactSection>
  )
}
