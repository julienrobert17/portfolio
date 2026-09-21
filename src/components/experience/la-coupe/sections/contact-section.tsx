import type { ReactNode } from 'react'
import RevealText from '../ui/reveal-text'
import styles from './contact-section.module.css'

interface ContactSectionProps {
  /** Numéro affiché en mono au-dessus du titre (« 01 »). */
  numero: string
  titre: string
  /** Contenu du rail, sous le titre (intro, table). */
  rail?: ReactNode
  children: ReactNode
}

/**
 * Gabarit des sections de la page contact : filet, rail de quatre colonnes
 * (numéro mono, titre révélé par lignes, contenu court) et corps sur les huit
 * colonnes restantes. Tout s'empile sous 900 px. La section est nommée par
 * `aria-label` : SplitText recompose le titre, un `id` n'y survivrait pas.
 */
export default function ContactSection({ numero, titre, rail, children }: ContactSectionProps) {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-label={titre}>
      <div className="lc-grid">
        <div className={styles.rail}>
          <p className="lc-mono lc-muted">{numero}</p>
          <RevealText as="h2" className={`lc-display lc-h3 ${styles.titre}`}>
            {titre}
          </RevealText>
          {rail}
        </div>
        <div className={styles.corps}>{children}</div>
      </div>
    </section>
  )
}
