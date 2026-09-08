'use client'

import { useCallback, useEffect, useRef } from 'react'

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

/** Écoute le code Konami au clavier et déclenche `onUnlock`. */
export function useKonami(onUnlock: () => void) {
  const indexRef = useRef(0)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const expected = SEQUENCE[indexRef.current]
      const key = expected.length === 1 ? event.key.toLowerCase() : event.key
      if (key === expected) {
        indexRef.current += 1
        if (indexRef.current === SEQUENCE.length) {
          indexRef.current = 0
          onUnlock()
        }
        return
      }
      // On redémarre la séquence, en tolérant un faux départ sur la 1re touche.
      indexRef.current = key === SEQUENCE[0] ? 1 : 0
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onUnlock])
}

/**
 * Équivalent tactile : plusieurs tapes rapides au même endroit. Le téléphone
 * n'a pas de flèches directionnelles, l'easter egg doit rester atteignable.
 */
export function useTapSecret(taps: number, windowMs: number, onUnlock: () => void) {
  const timesRef = useRef<number[]>([])

  return useCallback(() => {
    const now = Date.now()
    timesRef.current = [...timesRef.current, now].filter((time) => now - time < windowMs)
    if (timesRef.current.length >= taps) {
      timesRef.current = []
      onUnlock()
    }
  }, [taps, windowMs, onUnlock])
}
