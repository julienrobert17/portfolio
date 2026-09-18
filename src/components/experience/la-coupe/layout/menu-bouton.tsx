'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { abonnerMenu, lireMenu, lireMenuServeur, setMenuOuvert } from '../lib/navigation-store'
import styles from './nav.module.css'

/** Bouton Menu de la nav : ouvre et ferme l'overlay, porte l'état pour les lecteurs d'écran. */
export default function MenuBouton() {
  const ouvert = useSyncExternalStore(abonnerMenu, lireMenu, lireMenuServeur)
  const ref = useRef<HTMLButtonElement>(null)

  // La nav passe au-dessus du menu ouvert, en clair sur l'encre, pour que « Fermer » reste accessible.
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
      className={`lc-mono ${styles.lien} ${styles.menuBouton}`}
      aria-expanded={ouvert}
      aria-controls="lc-menu"
      data-menu-bouton
      data-magnetique
      onClick={() => setMenuOuvert(!ouvert)}
    >
      {ouvert ? 'Fermer' : 'Menu'}
    </button>
  )
}
