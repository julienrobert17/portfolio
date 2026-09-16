import { projets } from '../content/projets'
import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import Photo from '../ui/photo'
import styles from './fiche-hero.module.css'

interface FicheHeroProps {
  projet: Projet
}

/** Image de tête à 60 % de la hauteur, numéro d'index et titre. Élément partagé : Phase 4. */
export default function FicheHero({ projet }: FicheHeroProps) {
  const image = imageProjet(projet, 0)
  return (
    <header className={styles.hero}>
      <div className={styles.image}>
        <Photo image={image} cover priority />
      </div>
      <div className={`lc-container ${styles.entete}`}>
        <p className="lc-mono lc-muted">
          {formatNumero(projets.indexOf(projet))} / {formatNumero(projets.length - 1)}
        </p>
        <h1 className={`lc-display lc-h2 ${styles.titre}`}>{projet.titre}</h1>
        <p className={`lc-mono ${styles.sousTitre}`}>
          {projet.lieu} — {projet.annee}
        </p>
      </div>
    </header>
  )
}
