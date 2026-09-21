'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { abonnerMenu, lireMenu, lireMenuServeur, setMenuOuvert } from '../lib/navigation-store'
import styles from './nav.module.css'

/**
 * Icône de l'index des projets : un carré de 12 px au trait, coupé par un trait horizontal (la
 * coupe), qui devient une croix à l'ouverture. Sans libellé visible ; `aria-expanded` porte l'état.
 */
export default function MenuBouton() {
  const ouvert = useSyncExternalStore(abonnerMenu, lireMenu, lireMenuServeur)
  const ref = useRef<HTMLButtonElement>(null)

  // La nav passe au-dessus du menu ouvert, en clair sur l'encre, pour que la croix reste accessible.
  useEffect(() => {
    const header = ref.current?.closest('header')
    if (!header) return
    header.dataset.menu = String(ouvert)
    return () => {
      delete header.dataset.menu
    }
  }, [ouvert])

  return (
    <button
      ref={ref}
      type="button"
      className={styles.menuBouton}
      aria-label="Index des projets"
      aria-expanded={ouvert}
      aria-controls="lc-menu"
      data-menu-bouton
      data-magnetique
      onClick={() => setMenuOuvert(!ouvert)}
    >
      <span className={styles.icone} aria-hidden="true">
        <span className={styles.carre} />
        <span className={styles.trait} />
        <span className={styles.trait} />
      </span>
    </button>
  )
}
