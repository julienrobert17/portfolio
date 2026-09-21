import type { Projet, Ratio } from '../content/types'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import Photo from '../ui/photo'
import GalerieAnime from './galerie-anime'
import styles from './galerie.module.css'

interface GalerieProps {
  projet: Projet
}

/** Une image est « haute » (verticale ou carrée) ou « large ». */
const haute = (r: Ratio) => r === '4:5' || r === '1:1'

/**
 * Trois motifs, chacun fermé sur douze colonnes, donc sans creux :
 * - `plein` : une image large sur toute la largeur ;
 * - `paire` : deux images côte à côte, 6/6 à ratios égaux, 7/5 sinon (la plus large devant) ;
 * - `verticale` : une image haute seule, décalée sur les colonnes 3 à 8, sa légende sur 9 à 12.
 * Rien ne descend sous cinq colonnes.
 */
type Motif = 'plein' | 'paire' | 'verticale'

/** Rythme voulu, dans l'ordre ; chaque intention cède si les ratios ne s'y prêtent pas. */
const RYTHME: Motif[] = ['plein', 'paire', 'verticale', 'paire', 'plein', 'paire']

interface Case {
  index: number
  colonnes: string
  sizes: string
  /** Légende à droite de l'image, dans la même case (motif `verticale`). */
  aCote?: boolean
}

/** Découpe la séquence de ratios en motifs, puis chaque motif en cases de grille. */
function composer(ratios: Ratio[]): Case[] {
  const cases: Case[] = []
  let i = 0
  let etape = 0
  while (i < ratios.length) {
    const reste = ratios.length - i
    let motif = RYTHME[etape % RYTHME.length]
    etape += 1
    if (motif === 'paire' && reste < 2) motif = haute(ratios[i]) ? 'verticale' : 'plein'
    if (motif === 'plein' && haute(ratios[i])) motif = reste >= 2 ? 'paire' : 'verticale'
    if (motif === 'verticale' && !haute(ratios[i])) motif = 'plein'

    if (motif === 'plein') {
      cases.push({ index: i, colonnes: '1 / -1', sizes: '100vw' })
      i += 1
    } else if (motif === 'verticale') {
      cases.push({ index: i, colonnes: '3 / span 10', sizes: '(max-width: 720px) 100vw, 50vw', aCote: true })
      i += 1
    } else {
      const [a, b] = [ratios[i], ratios[i + 1]]
      // Ratios égaux : moitié-moitié. Sinon la plus large prend sept colonnes.
      const egaux = a === b
      const premiereLarge = egaux || !haute(a)
      const large = '(max-width: 720px) 100vw, 58vw'
      const etroite = '(max-width: 720px) 100vw, 42vw'
      const moitie = '(max-width: 720px) 100vw, 50vw'
      cases.push(
        { index: i, colonnes: egaux ? '1 / span 6' : premiereLarge ? '1 / span 7' : '1 / span 5', sizes: egaux ? moitie : premiereLarge ? large : etroite },
        { index: i + 1, colonnes: egaux ? '7 / span 6' : premiereLarge ? '8 / span 5' : '6 / span 7', sizes: egaux ? moitie : premiereLarge ? etroite : large },
      )
      i += 2
    }
  }
  return cases
}

/**
 * Séquence d'images en motifs fermés, choisis d'après la suite des ratios
 * (voir `composer`). Entrées et parallaxe différenciée : `galerie-anime.tsx`.
 */
export default function Galerie({ projet }: GalerieProps) {
  const images = projet.images.slice(1)
  const cases = composer(images.map((img) => img.ratio))
  return (
    <section className={`lc-container ${styles.section}`} aria-label="Galerie">
      <ol className={`lc-grid ${styles.grille}`}>
        {cases.map(({ index, colonnes, sizes, aCote }) => {
          const image = imageProjet(projet, index + 1)
          return (
            <li key={image.src} className={styles.item} style={{ gridColumn: colonnes }}>
              <figure className={`${styles.figure} ${aCote ? styles.aCote : ''}`} data-plein={colonnes === '1 / -1' || undefined}>
                <div className={styles.cadre}>
                  <Photo image={image} sizes={sizes} />
                </div>
                <figcaption className={`lc-mono ${styles.legende}`}>
                  <span className={styles.numero}>{formatNumero(index + 1)}</span>
                  <span className={styles.texte}>{image.alt}</span>
                </figcaption>
              </figure>
            </li>
          )
        })}
      </ol>
      <GalerieAnime />
    </section>
  )
}
