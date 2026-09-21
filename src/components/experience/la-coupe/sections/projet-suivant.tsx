import LienTransition from '../layout/lien-transition'
import { site } from '../content/site'
import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import PartageImage from '../ui/partage-image'
import Photo from '../ui/photo'
import RichText from '../ui/rich-text'
import hero from './fiche-hero.module.css'
import ProjetSuivantAnime from './projet-suivant-anime'
import styles from './projet-suivant.module.css'

interface ProjetSuivantProps {
  projet: Projet
}

/**
 * Dernier bloc : le projet suivant, 40vh au repos (image et légende en
 * surimpression), découvert jusqu'à 100vh au scroll (`projet-suivant-anime.tsx`).
 * En fin de course sa mise en page est celle du hero de la fiche cible, au
 * pixel : image sur 60vh depuis le haut du viewport, puis l'en-tête avec les
 * classes mêmes de `fiche-hero.module.css`. La navigation automatique change
 * alors de page sans que rien ne bouge ; seule la ligne mono change.
 */
export default function ProjetSuivant({ projet }: ProjetSuivantProps) {
  const image = imageProjet(projet, 0)
  return (
    <div className={styles.conteneur}>
      <LienTransition href={`${site.base}/projets/${projet.slug}`} type="partage" label={projet.titre} className={styles.bloc} aria-label={`Projet suivant : ${projet.titre}`} data-curseur="view">
        <div className={styles.image}>
          <PartageImage slug={projet.slug}>
            <Photo image={image} cover sizes="100vw" />
          </PartageImage>
        </div>
        <span className={`lc-container ${styles.legende}`}>
          <span className="lc-mono">Projet suivant</span>
          <span className={`lc-display lc-h3 ${styles.titre}`}>{projet.titre}</span>
        </span>
        {/* En-tête jumeau du hero de fiche, visible seulement quand le bloc est animé. */}
        <span className={`lc-container ${hero.entete} ${styles.entete}`} aria-hidden="true">
          <span className="lc-mono lc-muted">Projet suivant</span>
          <RichText text={projet.titre} as="span" className={`lc-display lc-h2 ${hero.titre}`} />
          <span className={`lc-mono ${hero.sousTitre}`}>
            {projet.lieu} — {projet.annee}
          </span>
        </span>
      </LienTransition>
      <ProjetSuivantAnime />
    </div>
  )
}
