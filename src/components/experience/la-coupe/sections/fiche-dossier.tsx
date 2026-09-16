import type { Projet } from '../content/types'
import { formatSurface } from '../lib/format'
import RichText from '../ui/rich-text'
import styles from './fiche-dossier.module.css'

interface FicheDossierProps {
  projet: Projet
}

/** Table de métadonnées en mono (pattern dossier d'archi) et texte sur les colonnes 5 à 10. */
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
        <dl className={`lc-mono ${styles.meta}`}>
          {lignes.map(([cle, valeur]) => (
            <div key={cle} className={styles.ligne}>
              <dt className={styles.cle}>{cle}</dt>
              <dd className={styles.valeur}>
                {Array.isArray(valeur) ? valeur.map((v) => <span key={v}>{v}</span>) : valeur}
              </dd>
            </div>
          ))}
        </dl>
        <div className={`lc-body ${styles.texte}`}>
          <RichText text={projet.texte} />
        </div>
      </div>
    </section>
  )
}
