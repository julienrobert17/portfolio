import { projets } from '../content/projets'
import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import PartageImage from '../ui/partage-image'
import Photo from '../ui/photo'
import RichText from '../ui/rich-text'
import { SIZES_TETE_PORTRAIT } from '../lib/images'
import FicheHeroAnime from './fiche-hero-anime'
import styles from './fiche-hero.module.css'

interface FicheHeroProps {
  projet: Projet
}

/** Image de tête à 60 % de la hauteur, numéro d'index et titre. Élément partagé : Phase 4. */
export default function FicheHero({ projet }: FicheHeroProps) {
  const image = imageProjet(projet, 0)
  return (
    <header className={styles.hero} data-hero-fiche>
      <div className={styles.image} data-fiche="image">
        <PartageImage slug={projet.slug}>
          <Photo image={image} cover priority sizes="100vw" sizesPortrait={SIZES_TETE_PORTRAIT} />
        </PartageImage>
      </div>
      <div className={`lc-container ${styles.entete}`}>
        <p className="lc-mono lc-muted" data-fiche="entree">
          {formatNumero(projets.indexOf(projet))} / {formatNumero(projets.length - 1)}
        </p>
        <RichText text={projet.titre} as="h1" className={`lc-display lc-h2 ${styles.titre}`} reveal />
        <p className={`lc-mono ${styles.sousTitre}`} data-fiche="entree">
          {projet.lieu} — {projet.annee}
        </p>
      </div>
      <FicheHeroAnime />
    </header>
  )
}
