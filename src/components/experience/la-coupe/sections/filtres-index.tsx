'use client'

import Link from 'next/link'
import type { MouseEvent, ReactNode } from 'react'
import { categories } from '../content'
import { site } from '../content/site'
import type { Categorie } from '../content/types'
import styles from './filtres-index.module.css'

export type Vue = 'liste' | 'grille'

interface FiltresIndexProps {
  vue: Vue
  categorie: Categorie | null
  /**
   * Navigation côté client (router.replace) ; sans elle, les liens
   * naviguent normalement, ce qui reste le chemin sans JavaScript.
   */
  onNaviguer?: (url: string) => void
}

export function urlProjets(vue: Vue, categorie: Categorie | null): string {
  const params = new URLSearchParams()
  if (vue === 'grille') params.set('vue', 'grille')
  if (categorie) params.set('programme', categorie)
  const q = params.toString()
  return `${site.base}/projets${q ? `?${q}` : ''}`
}

interface FiltreProps {
  href: string
  actif: boolean
  className: string
  onNaviguer?: (url: string) => void
  children: ReactNode
}

/** Lien à href valide ; avec `onNaviguer`, le clic simple reste sur la page. */
function Filtre({ href, actif, className, onNaviguer, children }: FiltreProps) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Clic modifié (nouvel onglet…) : on laisse le navigateur faire.
    if (!onNaviguer || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onNaviguer(href)
  }
  return (
    <Link href={href} className={className} aria-current={actif ? 'page' : undefined} onClick={onClick}>
      {children}
    </Link>
  )
}

/**
 * Bascule liste / grille et filtres par programme, tout dans l'URL : la page
 * fonctionne sans JavaScript. Avec, `onNaviguer` remplace l'URL sans
 * défilement et laisse le parent réordonner les lignes (Flip).
 */
export default function FiltresIndex({ vue, categorie, onNaviguer }: FiltresIndexProps) {
  return (
    <div className={styles.barre}>
      <nav aria-label="Filtrer par programme">
        <ul className={styles.pills}>
          <li>
            <Filtre href={urlProjets(vue, null)} actif={categorie === null} className={`lc-mono ${styles.pill}`} onNaviguer={onNaviguer}>
              Tous
            </Filtre>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <Filtre href={urlProjets(vue, c)} actif={categorie === c} className={`lc-mono ${styles.pill}`} onNaviguer={onNaviguer}>
                {c}
              </Filtre>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Mode d'affichage" className={`lc-mono ${styles.vues}`}>
        <Filtre href={urlProjets('liste', categorie)} actif={vue === 'liste'} className={styles.vue} onNaviguer={onNaviguer}>
          Liste
        </Filtre>
        <span aria-hidden="true"> / </span>
        <Filtre href={urlProjets('grille', categorie)} actif={vue === 'grille'} className={styles.vue} onNaviguer={onNaviguer}>
          Grille
        </Filtre>
      </nav>
    </div>
  )
}
