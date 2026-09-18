'use client'

import { useEffect } from 'react'

/** Une image différée hors de cette zone ne se chargera pas avant qu'on défile : on ne l'attend pas. */
const MARGE_VIEWPORT = 1.5
/** Filet de sécurité : au-delà, on considère la page posée quoi qu'il arrive. */
const DELAI_MAX = 2000

/**
 * Appelle `onSettled` quand les polices et les images visibles de la page
 * courante sont chargées : c'est le moment de mesurer (Lenis, ScrollTrigger)
 * et de lever le rideau. Relancé à chaque changement de `cle` (le pathname).
 */
export function usePageSettled(cle: string, onSettled: () => void): void {
  useEffect(() => {
    let annule = false
    const limite = window.innerHeight * MARGE_VIEWPORT
    const images = Array.from(document.images).filter(
      (img) => !img.complete && img.getAttribute('src') && (img.loading !== 'lazy' || img.getBoundingClientRect().top < limite),
    )
    const attentes: Promise<unknown>[] = images.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        }),
    )
    attentes.push(document.fonts.ready)
    let fini = false
    const terminer = () => {
      if (annule || fini) return
      fini = true
      onSettled()
    }
    const garde = window.setTimeout(terminer, DELAI_MAX)
    Promise.all(attentes).then(terminer)
    return () => {
      annule = true
      window.clearTimeout(garde)
    }
  }, [cle, onSettled])
}
