import Link from 'next/link'
import { projets as tous } from '../content/projets'
import { site } from '../content/site'
import type { Projet } from '../content/types'
import { formatNumero } from '../lib/format'
import styles from './index-projets.module.css'

interface IndexProjetsProps {
  projets: Projet[]
  titre?: string
  /** Lien de bas de liste, par exemple vers l'index complet. */
  lien?: { label: string; href: string }
  /** Sans entête ni marges : quand la liste vit dans une page déjà titrée. */
  nu?: boolean
}

/**
 * Index typographique : numéro, titre, lieu, année, statut. Le numéro garde
 * celui de l'index complet, même filtré. Image flottante au survol : Phase 3.
 */
export default function IndexProjets({ projets, titre = 'Index', lien, nu = false }: IndexProjetsProps) {
  return (
    <section className={nu ? undefined : `lc-container lc-section ${styles.section}`} aria-label={titre}>
      {nu ? null : (
        <h2 className={`lc-mono ${styles.titre}`}>
          {titre}
        </h2>
      )}
      <ol className={styles.liste}>
        {projets.map((projet) => (
          <li key={projet.slug} className={styles.item}>
            <Link href={`${site.base}/projets/${projet.slug}`} className={styles.ligne}>
              <span className={`lc-mono ${styles.numero}`}>{formatNumero(tous.indexOf(projet))}</span>
              <span className={`lc-display lc-h3 ${styles.nom}`}>{projet.titre}</span>
              <span className={styles.details}>
                <span className={`lc-mono lc-muted ${styles.lieu}`}>{projet.lieu}</span>
                <span className={`lc-mono ${styles.annee}`}>{projet.annee}</span>
                <span className={`lc-mono lc-muted ${styles.statut}`}>{projet.statut}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {lien ? (
        <p className={styles.pied}>
          <Link href={lien.href} className={`lc-mono lc-link ${styles.lien}`}>
            {lien.label}
          </Link>
        </p>
      ) : null}
    </section>
  )
}
