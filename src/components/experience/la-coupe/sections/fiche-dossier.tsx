import type { Projet } from '../content/types'
import { formatSurface } from '../lib/format'
import Apparition from '../ui/apparition'
import RichText from '../ui/rich-text'
import styles from './fiche-dossier.module.css'
import { insecable } from '../lib/typo'

interface FicheDossierProps {
  projet: Projet
}

/**
 * Table de métadonnées en mono (pattern dossier d'archi), entrée ligne par
 * ligne, et texte révélé par lignes sur les colonnes 5 à 10.
 */
export default function FicheDossier({ projet }: FicheDossierProps) {
  const lignes: Array<[string, string | string[]]> = [
    ['Lieu', projet.lieu],
    ['Année', String(projet.annee)],
    ['Surface', formatSurface(projet.surface)],
    ['Programme', projet.programme],
    ['Statut', projet.statut],
    ['Maîtrise d’ouvrage', projet.maitriseOuvrage],
    ['Équipe', projet.equipe],
  ]
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Dossier du projet">
      <div className="lc-grid">
        <Apparition as="dl" className={`lc-mono ${styles.meta}`}>
          {lignes.map(([cle, valeur]) => (
            <div key={cle} className={styles.ligne}>
              <dt className={styles.cle}>{cle}</dt>
              <dd className={styles.valeur}>
                {Array.isArray(valeur) ? valeur.map((v) => <span key={v}>{insecable(v)}</span>) : insecable(valeur)}
              </dd>
            </div>
          ))}
        </Apparition>
        <div className={`lc-body ${styles.texte}`}>
          <RichText text={projet.texte} reveal />
        </div>
      </div>
    </section>
  )
}
