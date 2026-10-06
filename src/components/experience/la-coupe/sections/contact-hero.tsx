import { site } from '../content/site'
import Apparition from '../ui/apparition'
import RevealText from '../ui/reveal-text'
import ContactStatut from './contact-statut'
import styles from './contact-hero.module.css'

/**
 * Tête de la page contact, un écran de haut : la question en display, puis
 * en pied l'adresse magnétique (`Magnetisme` est monté par le layout) et le
 * délai de réponse en mono. Sous le titre, le statut de l'atelier, calculé
 * sur l'heure de Paris. L'adresse se coupe après l'arobase si la largeur
 * manque, jamais au milieu d'un mot.
 */
export default function ContactHero() {
  const { contact } = site
  const [boite, domaine] = contact.email.split('@')
  return (
    <Apparition as="header" className={`lc-container ${styles.hero}`} selecteur="[data-entree]">
      <div className={styles.tete}>
        <p className="lc-mono lc-muted" data-entree>
          {contact.surtitre}
        </p>
        <RevealText as="h1" className="lc-display lc-h1">
          {contact.cta}
        </RevealText>
        <ContactStatut className={`lc-mono ${styles.statut}`} />
      </div>
      <div className={`lc-grid ${styles.pied}`}>
        {/* L'entrée anime le paragraphe, le magnétisme le lien : deux transformations, deux éléments. */}
        <p className={styles.adresse} data-entree>
          <a href={`mailto:${contact.email}`} className={`lc-display ${styles.email}`} data-magnetique>
            {boite}@<wbr />
            {domaine}
          </a>
        </p>
        <p className={`lc-mono lc-muted ${styles.reponse}`} data-entree>
          {contact.reponse}
        </p>
      </div>
    </Apparition>
  )
}
