import Link from 'next/link'
import { categories } from '../content'
import { site } from '../content/site'
import type { Categorie } from '../content/types'
import styles from './filtres-index.module.css'

export type Vue = 'liste' | 'grille'

interface FiltresIndexProps {
  vue: Vue
  categorie: Categorie | null
}

function url(vue: Vue, categorie: Categorie | null): string {
  const params = new URLSearchParams()
  if (vue === 'grille') params.set('vue', 'grille')
  if (categorie) params.set('programme', categorie)
  const q = params.toString()
  return `${site.base}/projets${q ? `?${q}` : ''}`
}

/**
 * Bascule liste / grille et filtres par programme, tout dans l'URL : la page
 * fonctionne sans JavaScript. Réordonnancement FLIP des lignes : Phase 3.
 */
export default function FiltresIndex({ vue, categorie }: FiltresIndexProps) {
  return (
    <div className={styles.barre}>
      <nav aria-label="Filtrer par programme">
        <ul className={styles.pills}>
          <li>
            <Link href={url(vue, null)} className={`lc-mono ${styles.pill}`} aria-current={categorie === null ? 'page' : undefined}>
              Tous
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <Link href={url(vue, c)} className={`lc-mono ${styles.pill}`} aria-current={categorie === c ? 'page' : undefined}>
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Mode d'affichage" className={`lc-mono ${styles.vues}`}>
        <Link href={url('liste', categorie)} className={styles.vue} aria-current={vue === 'liste' ? 'page' : undefined}>
          Liste
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={url('grille', categorie)} className={styles.vue} aria-current={vue === 'grille' ? 'page' : undefined}>
          Grille
        </Link>
      </nav>
    </div>
  )
}
