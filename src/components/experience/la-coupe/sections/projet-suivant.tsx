import Link from 'next/link'
import { site } from '../content/site'
import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import Photo from '../ui/photo'
import styles from './projet-suivant.module.css'

interface ProjetSuivantProps {
  projet: Projet
}

/** Dernier bloc : l'image du projet suivant, 40vh. Elle grandira au scroll en Phase 3. */
export default function ProjetSuivant({ projet }: ProjetSuivantProps) {
  const image = imageProjet(projet, 0)
  return (
    <Link href={`${site.base}/projets/${projet.slug}`} className={styles.bloc} aria-label={`Projet suivant : ${projet.titre}`}>
      <div className={styles.image}>
        <Photo image={image} cover />
      </div>
      <span className={`lc-container ${styles.legende}`}>
        <span className="lc-mono">Projet suivant</span>
        <span className={`lc-display lc-h3 ${styles.titre}`}>{projet.titre}</span>
      </span>
    </Link>
  )
}
