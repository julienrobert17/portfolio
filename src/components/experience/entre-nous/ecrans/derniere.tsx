'use client'

import { useEffect, useState } from 'react'
import styles from '../entre-nous.module.css'
import { UI } from '../content'

/** Le temps qu'on laisse à la question avant que l'écran s'en aille. */
const AVANT_EXTINCTION = 20000

/**
 * Troisième et dernier temps.
 *
 * Une question, rien autour : pas de champ, pas de bouton, pas de partage, pas
 * de « recommencer ». L'expérience ne cherche pas à se prolonger — elle rend
 * la main à la conversation et s'efface. L'écran s'éteint tout seul au bout de
 * vingt secondes, et il n'y a rien après.
 *
 * Le fondu est conservé sous mouvement réduit : c'est une variation de
 * lumière, pas un déplacement, et l'extinction est le point de la scène.
 */
export default function Derniere() {
  const [eteint, setEteint] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEteint(true), AVANT_EXTINCTION)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`${styles.plein} ${styles.pleinNu} ${eteint ? styles.eteint : ''}`}>
      <p className={styles.derniere}>{UI.derniere.question}</p>
      <p className={styles.consigne}>{UI.derniere.consigne}</p>
    </div>
  )
}
