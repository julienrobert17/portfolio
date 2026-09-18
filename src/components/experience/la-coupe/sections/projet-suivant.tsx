import LienTransition from '../layout/lien-transition'
import { site } from '../content/site'
import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import PartageImage from '../ui/partage-image'
import Photo from '../ui/photo'
import ProjetSuivantAnime from './projet-suivant-anime'
import styles from './projet-suivant.module.css'

interface ProjetSuivantProps {
  projet: Projet
}

/**
 * Dernier bloc : l'image du projet suivant, 40vh au repos, qui grandit
 * jusqu'à 100vh au scroll dans un conteneur de hauteur fixe
 * (`projet-suivant-anime.tsx`). Navigation automatique : Phase 4.
 */
export default function ProjetSuivant({ projet }: ProjetSuivantProps) {
  const image = imageProjet(projet, 0)
  return (
    <div className={styles.conteneur}>
      <LienTransition href={`${site.base}/projets/${projet.slug}`} type="partage" label={projet.titre} className={styles.bloc} aria-label={`Projet suivant : ${projet.titre}`} data-curseur="view">
        <div className={styles.image}>
          <PartageImage slug={projet.slug}>
            <Photo image={image} cover />
          </PartageImage>
        </div>
        <span className={`lc-container ${styles.legende}`}>
          <span className="lc-mono">Projet suivant</span>
          <span className={`lc-display lc-h3 ${styles.titre}`}>{projet.titre}</span>
        </span>
      </LienTransition>
      <ProjetSuivantAnime />
    </div>
  )
}
