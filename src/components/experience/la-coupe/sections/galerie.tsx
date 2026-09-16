import type { Projet } from '../content/types'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import Photo from '../ui/photo'
import styles from './galerie.module.css'

interface GalerieProps {
  projet: Projet
}

/**
 * Séquence d'images à layouts variés : plein écran, deux côte à côte, une
 * petite décalée, une verticale. Le placement suit la position, pas le ratio.
 * Parallaxe différenciée : Phase 3.
 */
const PLACEMENTS = ['1 / -1', '1 / span 6', '7 / span 6', '8 / span 5', '2 / span 5', '1 / -1', '7 / span 6', '1 / span 5', '4 / span 6']

/** Une image verticale ou carrée ne prend jamais toute la largeur : elle passe au centre, sur six colonnes. */
function placement(i: number, ratio: string): string {
  const p = PLACEMENTS[i % PLACEMENTS.length]
  if (p === '1 / -1' && (ratio === '4:5' || ratio === '1:1')) return '4 / span 6'
  return p
}

export default function Galerie({ projet }: GalerieProps) {
  const images = projet.images.slice(1)
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Galerie">
      <ol className={`lc-grid ${styles.grille}`}>
        {images.map((_, i) => {
          const image = imageProjet(projet, i + 1)
          return (
            <li key={image.src} className={styles.item} style={{ gridColumn: placement(i, image.ratio) }}>
              <figure className={styles.figure}>
                <Photo image={image} />
                <figcaption className="lc-mono lc-muted">{formatNumero(i + 1)}</figcaption>
              </figure>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
