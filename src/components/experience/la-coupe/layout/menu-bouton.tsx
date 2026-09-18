'use client'

import { useSyncExternalStore } from 'react'
import { abonnerMenu, lireMenu, lireMenuServeur, setMenuOuvert } from '../lib/navigation-store'
import styles from './nav.module.css'

/** Bouton Menu de la nav : ouvre et ferme l'overlay, porte l'état pour les lecteurs d'écran. */
export default function MenuBouton() {
  const ouvert = useSyncExternalStore(abonnerMenu, lireMenu, lireMenuServeur)
  return (
    <button
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
