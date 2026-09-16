import Link from 'next/link'
import { projets } from '../content/projets'
import { site } from '../content/site'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import Photo from '../ui/photo'
import styles from './projets-selectionnes.module.css'

/**
 * Les projets phares, un écran chacun. Sticky stacking, distorsion et curseur
 * « Voir le projet » : Phase 3 et 4. Ici, une suite d'écrans pleins.
 */
export default function ProjetsSelectionnes() {
  const selection = site.selection
    .map((slug) => projets.find((p) => p.slug === slug))
    .filter((p): p is (typeof projets)[number] => Boolean(p))
  const total = formatNumero(projets.length - 1)
  return (
    <section aria-labelledby="selection-titre" className={styles.section}>
      <div className={`lc-container ${styles.entete}`}>
        <h2 id="selection-titre" className="lc-mono">
          Projets sélectionnés
        </h2>
        <p className="lc-mono lc-muted">
          {formatNumero(selection.length - 1)} / {total}
        </p>
      </div>
      {selection.map((projet) => {
        const image = imageProjet(projet, 0)
        const numero = formatNumero(projets.indexOf(projet))
        return (
          <article key={projet.slug} className={styles.bloc}>
            <Link href={`${site.base}/projets/${projet.slug}`} className={styles.lien} aria-label={`${projet.titre}, voir le projet`}>
              <div className={styles.image}>
                <Photo image={image} cover />
              </div>
              <span className={`lc-mono ${styles.index}`}>
                {numero} / {total}
              </span>
              <div className={styles.legende}>
                <h3 className={`lc-display lc-h2 ${styles.titre}`}>{projet.titre}</h3>
                <p className={`lc-mono ${styles.meta}`}>
                  {projet.lieu} — {projet.annee}
                </p>
              </div>
            </Link>
          </article>
        )
      })}
    </section>
  )
}
