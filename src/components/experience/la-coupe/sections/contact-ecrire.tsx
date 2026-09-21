import { site } from '../content/site'
import Apparition from '../ui/apparition'
import ContactComposeur from './contact-composeur'
import ContactSection from './contact-section'
import styles from './contact-ecrire.module.css'

/**
 * « Écrire » : le composeur, amélioration progressive d'un simple lien mailto.
 * Sans JavaScript, les contrôles (inertes) sont retirés par la feuille du
 * <noscript> : il reste l'aperçu du message par défaut et son lien.
 */
export default function ContactEcrire() {
  const { composeur } = site.contact
  return (
    <ContactSection
      numero="01"
      titre={composeur.titre}
      rail={<p className={styles.intro}>{composeur.intro}</p>}
    >
      <noscript>
        <style>{'[data-composeur-controles]{display:none!important}'}</style>
      </noscript>
      <Apparition bloc>
        <ContactComposeur />
      </Apparition>
    </ContactSection>
  )
}
