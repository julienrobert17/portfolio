import LienTransition from '../layout/lien-transition'
import { projets } from '../content/projets'
import { site } from '../content/site'
import { imageProjet } from '../lib/images'
import { formatNumero } from '../lib/format'
import PartageImage from '../ui/partage-image'
import Photo from '../ui/photo'
import Empilement from './empilement'
import styles from './projets-selectionnes.module.css'

/**
 * Les projets phares, un écran chacun, en sticky stacking (voir Empilement).
 * Curseur « Voir le projet » : Phase 4.
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
      </div>
      <Empilement />
      {selection.map((projet, i) => {
        const image = imageProjet(projet, 0)
        const numero = formatNumero(projets.indexOf(projet))
        return (
          <article key={projet.slug} className={styles.bloc} data-bloc>
            {/* Nom du lien : « Voir le projet Maison des Vignes Meursault, Bourgogne — 2023 01 / 08 ».
                L'image est décorative ici (le titre la nomme), l'index vient en dernier : il est positionné en absolu. */}
            <LienTransition href={`${site.base}/projets/${projet.slug}`} type="partage" label={projet.titre} className={styles.lien} data-curseur="view">
              <span className="lc-visually-hidden">Voir le projet</span>
              <div className={styles.image} data-image-bloc>
                <PartageImage slug={projet.slug}>
                  {/* Un viewport sous le hero : chargé d'emblée mais sans préchargement (il resterait inutilisé), les suivants différés. */}
                  <Photo image={{ ...image, alt: '' }} cover eager={i === 0} sizes="100vw" />
                </PartageImage>
              </div>
              <div className={styles.voile} data-voile aria-hidden="true" />
              <div className={styles.legende}>
                <h3 className={`lc-display lc-h2 ${styles.titre}`}>{projet.titre}</h3>
                <p className={`lc-mono ${styles.meta}`}>
                  {projet.lieu} — {projet.annee}
                </p>
              </div>
              <span className={`lc-mono ${styles.index}`}>
                {numero} / {total}
              </span>
            </LienTransition>
          </article>
        )
      })}
    </section>
  )
}
