import { atelier } from '../content/atelier'
import { imagesAtelier } from '../content/site'
import { imageAtelier } from '../lib/images'
import Apparition from '../ui/apparition'
import ImageFlottante from '../ui/image-flottante'
import Photo from '../ui/photo'
import styles from './equipe.module.css'

/**
 * Liste typographique. La vignette est toujours visible : rien n'est réservé
 * au survol ; l'image flottante (pointeur fin, ou focus clavier) est un plus.
 */
export default function Equipe() {
  return (
    <section className={`lc-container lc-section ${styles.section}`} aria-labelledby="equipe-titre">
      <h2 id="equipe-titre" className={`lc-mono ${styles.titre}`}>
        Équipe
      </h2>
      {/* L'image flottante cherche les [data-image] dans son parent : ce div, et non le <ul>, pour garder un HTML valide. */}
      <div className={styles.conteneur}>
        <Apparition as="ul" className={styles.liste}>
          {atelier.equipe.map((m) => {
            const contenu = imagesAtelier[m.photo]
            const photo = contenu ? imageAtelier(m.photo, contenu) : null
            return (
              <li key={m.nom} className={styles.membre} data-image={photo?.src} data-image-alt={photo?.alt}>
                {photo ? (
                  <span className={styles.vignette}>
                    <Photo image={photo} />
                  </span>
                ) : null}
                <span className={`lc-display lc-h3 ${styles.nom}`}>{m.nom}</span>{' '}
                <span className={`lc-mono lc-muted ${styles.role}`}>{m.role}</span>
              </li>
            )
          })}
        </Apparition>
        <ImageFlottante />
      </div>
    </section>
  )
}
