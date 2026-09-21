import LienTransition from '../layout/lien-transition'
import { projets as tous } from '../content/projets'
import { site } from '../content/site'
import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import Apparition from '../ui/apparition'
import PartageImage from '../ui/partage-image'
import Photo from '../ui/photo'
import styles from './grille-projets.module.css'

interface GrilleProjetsProps {
  projets: Projet[]
}

/** Colonnes 5/7, 4/8, 6/6 alternées : la largeur suit la position, pas le projet. */
const PLACEMENTS = ['1 / span 5', '8 / span 5', '1 / span 4', '6 / span 7', '1 / span 6', '7 / span 6', '2 / span 5', '8 / span 5']

/** Tuiles en entrée standard (fondu + 24 px, stagger 0,06) ; `data-flip-id` pour le réordonnancement. */
export default function GrilleProjets({ projets }: GrilleProjetsProps) {
  return (
    <Apparition as="ul" className={`lc-grid ${styles.grille}`}>
      {projets.map((projet, i) => {
        const image = imageProjet(projet, 0)
        return (
          <li key={projet.slug} className={styles.item} style={{ gridColumn: PLACEMENTS[i % PLACEMENTS.length] }} data-flip-id={projet.slug}>
            <LienTransition href={`${site.base}/projets/${projet.slug}`} type="partage" label={projet.titre} className={styles.lien} data-curseur="view">
              <PartageImage slug={projet.slug} source>
                <Photo image={image} sizes="(max-width: 720px) 100vw, 58vw" />
              </PartageImage>
              <span className={styles.legende}>
                <span className={`lc-mono ${styles.numero}`}>{formatNumero(tous.indexOf(projet))}</span>{' '}
                <span className={styles.nom}>{projet.titre}</span>{' '}
                <span className={`lc-mono lc-muted ${styles.meta}`}>
                  {projet.lieu} — {projet.annee}
                </span>
              </span>
            </LienTransition>
          </li>
        )
      })}
    </Apparition>
  )
}
