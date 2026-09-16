'use client'

import { useEffect } from 'react'

/**
 * Appelle `onSettled` quand les polices et les images de la page courante
 * sont chargées : c'est le moment de mesurer (Lenis, ScrollTrigger).
 * Relancé à chaque changement de `cle` (le pathname).
 */
export function usePageSettled(cle: string, onSettled: () => void): void {
  useEffect(() => {
    let annule = false
    const images = Array.from(document.images).filter((img) => !img.complete)
    const attentes: Promise<unknown>[] = images.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true })
          img.addEventListener('error', () => resolve(), { once: true })
        }),
    )
    attentes.push(document.fonts.ready)
    Promise.all(attentes).then(() => {
      if (!annule) onSettled()
    })
    return () => {
      annule = true
    }
  }, [cle, onSettled])
}
