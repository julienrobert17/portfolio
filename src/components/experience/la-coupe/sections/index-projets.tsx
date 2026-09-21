import LienTransition from '../layout/lien-transition'
import { projets as tous } from '../content/projets'
import { site } from '../content/site'
import type { Projet } from '../content/types'
import { formatNumero } from '../lib/format'
import { imageProjet } from '../lib/images'
import Apparition from '../ui/apparition'
import ImageFlottante from '../ui/image-flottante'
import { srcVignette } from '../ui/src-vignette'
import styles from './index-projets.module.css'

interface IndexProjetsProps {
  projets: Projet[]
  titre?: string
  /** Lien de bas de liste, par exemple vers l'index complet. */
  lien?: { label: string; href: string }
  /** Sans entête ni marges : quand la liste vit dans une page déjà titrée. */
  nu?: boolean
}

/**
 * Index typographique : numéro, titre, lieu, année, statut. Le numéro garde
 * celui de l'index complet, même filtré. Les lignes entrent en fondu
 * (une fois) et portent la première image du projet en `data-image` pour
 * l'image flottante, placée dans la section (elle écoute son parent).
 * `data-flip-id` sert au réordonnancement de la page projets.
 */
export default function IndexProjets({ projets, titre = 'Index', lien, nu = false }: IndexProjetsProps) {
  return (
    <section className={nu ? undefined : `lc-container lc-section ${styles.section}`} aria-label={titre}>
      {nu ? null : (
        <h2 className={`lc-mono ${styles.titre}`}>
          {titre}
        </h2>
      )}
      <Apparition as="ol" className={styles.liste}>
        {projets.map((projet) => {
          const image = imageProjet(projet, 0)
          return (
            <li key={projet.slug} className={styles.item} data-flip-id={projet.slug} data-image={srcVignette(image)} data-image-alt={image.alt}>
              <LienTransition href={`${site.base}/projets/${projet.slug}`} type="partage" label={projet.titre} className={styles.ligne} data-curseur="default">
                <span className={`lc-mono ${styles.numero}`}>{formatNumero(tous.indexOf(projet))}</span>{' '}
                <span className={`lc-display lc-h3 ${styles.nom}`}>{projet.titre}</span>{' '}
                <span className={styles.details}>
                  <span className={`lc-mono lc-muted ${styles.lieu}`}>{projet.lieu}</span>{' '}
                  <span className={`lc-mono ${styles.annee}`}>{projet.annee}</span>{' '}
                  <span className={`lc-mono lc-muted ${styles.statut}`}>{projet.statut}</span>
                </span>
              </LienTransition>
            </li>
          )
        })}
      </Apparition>
      <ImageFlottante />
      {lien ? (
        <p className={styles.pied}>
          <LienTransition href={lien.href} label="Projets" className={`lc-mono lc-link ${styles.lien}`} data-magnetique>
            {lien.label}
          </LienTransition>
        </p>
      ) : null}
    </section>
  )
}
