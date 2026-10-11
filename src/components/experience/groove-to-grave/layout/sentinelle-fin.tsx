'use client'

import { useEffect } from 'react'
import { definirFinDeBande } from '../store/lecteur-store'

/**
 * Sentinelle du pied de page : quand « fin de bande » entre dans l'écran, le lecteur affiche
 * FIN DE BANDE à la place des compteurs (et en tête de la bande sur mobile) ; il reprend les
 * compteurs dès que le pied de page sort. Ne rend rien.
 */
export default function SentinelleFin() {
  useEffect(() => {
    const pied = document.getElementById('fin-de-bande')
    if (!pied) return
    const observateur = new IntersectionObserver(([e]) => definirFinDeBande(e.isIntersecting), { threshold: 0 })
    observateur.observe(pied)
    return () => {
      observateur.disconnect()
      definirFinDeBande(false)
    }
  }, [])
  return null
}
