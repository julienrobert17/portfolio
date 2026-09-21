'use client'

import LienTransition from './lien-transition'
import { usePathname } from 'next/navigation'
import { site } from '../content/site'
import styles from './nav.module.css'

/** Liens principaux, avec l'état courant pour les lecteurs d'écran. */
export default function NavLinks() {
  const pathname = usePathname()
  return (
    <ul className={styles.liens}>
      {site.nav.map((item) => {
        const href = `${site.base}${item.href}`
        const courant = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <li key={item.href}>
            <LienTransition href={href} label={item.label} className={`lc-mono ${styles.lien}`} aria-current={courant ? 'page' : undefined}>
              {item.label}
            </LienTransition>
          </li>
        )
      })}
    </ul>
  )
}
