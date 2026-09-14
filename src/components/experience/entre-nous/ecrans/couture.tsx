'use client'

import { useEffect, useState } from 'react'
import styles from '../entre-nous.module.css'
import SplitStage from '../layout/split-stage'
import { UI } from '../content'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import type { Cote, Installation } from '../types'

/** La ligne s'en va d'abord, les moitiés se rejoignent ensuite. */
const AVANT_FUSION = 700
const DUREE_FUSION = 1600

interface CoutureProps {
  installation: Installation
  noms: Record<Cote, string>
  onContinuer: () => void
}

/**
 * Premier temps de la fin, et la seule animation ample de toute l'expérience.
 *
 * Pendant vingt minutes, la ligne a séparé deux territoires et la moitié du
 * haut s'est lue à l'envers. Ici les trois choses se défont d'un seul geste :
 * la ligne s'efface, les deux fonds convergent vers la même nuit, et la
 * rotation à 180° se déroule. À la fin l'écran est entier, et il n'a plus de
 * haut ni de bas — on peut le prendre à deux.
 *
 * Tout le reste de l'expérience est volontairement sobre pour que ce
 * mouvement-ci surprenne.
 */
export default function Couture({ installation, noms, onContinuer }: CoutureProps) {
  const reduced = useReducedMotion()
  // Sous mouvement réduit, on ne joue rien : l'écran est déjà entier.
  const [fusion, setFusion] = useState(reduced)
  const [fini, setFini] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const t1 = setTimeout(() => setFusion(true), AVANT_FUSION)
    const t2 = setTimeout(() => setFini(true), AVANT_FUSION + DUREE_FUSION)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [reduced])

  return (
    <>
      <SplitStage
        installation={installation}
        acte={3}
        coutureEnCours={fusion}
        moitieA={<p className={`${styles.nom} ${fusion ? styles.nomParti : ''}`}>{noms.a}</p>}
        moitieB={<p className={`${styles.nom} ${fusion ? styles.nomParti : ''}`}>{noms.b}</p>}
      />
      {fini && (
        <div className={`${styles.plein} ${styles.pleinPose} ${reduced ? '' : styles.pleinArrive}`}>
          <h1 className={styles.titre}>{UI.couture.titre}</h1>
          <p className={styles.sous}>{UI.couture.sous}</p>
          <button type="button" className={`${styles.btn} ${styles.btnFort}`} onClick={onContinuer}>
            {UI.couture.continuer}
          </button>
        </div>
      )}
    </>
  )
}
