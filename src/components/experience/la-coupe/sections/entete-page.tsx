import Apparition from '../ui/apparition'
import RevealText from '../ui/reveal-text'
import styles from './entete-page.module.css'

interface EntetePageProps {
  surtitre: string
  titre: string
  intro?: string
}

/**
 * Entête commune des pages intérieures : surtitre mono en entrée standard,
 * titre display et intro révélés par lignes (l'intro avec un léger retard).
 */
export default function EntetePage({ surtitre, titre, intro }: EntetePageProps) {
  return (
    <Apparition as="header" className={`lc-container ${styles.entete}`} selecteur="[data-entree]">
      <p className="lc-mono lc-muted" data-entree>
        {surtitre}
      </p>
      <RevealText as="h1" className="lc-display lc-h1">
        {titre}
      </RevealText>
      {intro ? (
        <RevealText as="p" className={`lc-lead ${styles.intro}`} delay={0.15}>
          {intro}
        </RevealText>
      ) : null}
    </Apparition>
  )
}
