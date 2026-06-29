'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { BEATS, type Beat, type Lang } from './constants/narrative'
import { FAST_FORWARD_FACTOR, KEYBINDS } from './constants/timeline'

const LANG_KEY = 'prototaxites_lang'

interface NarrativeState {
  currentBeatIndex: number
  currentBeat: Beat
  progress: number          // 0→1, progression dans le beat courant
  isPaused: boolean
  isFastForward: boolean
  lang: Lang
  geologicalDate: number | null  // valeur courante affichée (Ma), null si pas de date active
  isLastBeat: boolean
}

interface NarrativeControls {
  goToNext: () => void
  goToPrev: () => void
  togglePause: () => void
  toggleFastForward: () => void
  setLang: (lang: Lang) => void
}

export function useNarrativeEngine(): NarrativeState & NarrativeControls {
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [progress, setProgress]                 = useState(0)
  const [isPaused, setIsPaused]                 = useState(false)
  const [isFastForward, setIsFastForward]       = useState(false)
  const [lang, setLangState]                    = useState<Lang>('en')

  // Refs pour la boucle RAF — évitent de re-enregistrer les effets à chaque render
  const rafRef              = useRef<number>(0)
  const lastTimestampRef    = useRef<number | null>(null)
  const elapsedRef          = useRef<number>(0)
  const currentBeatIndexRef = useRef<number>(0)
  const isPausedRef         = useRef<boolean>(false)
  const isFastForwardRef    = useRef<boolean>(false)

  // Lecture de la langue depuis localStorage (client uniquement)
  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'en' || stored === 'fr') setLangState(stored)
  }, [])

  // Boucle RAF — unique effet, jamais re-enregistré
  useEffect(() => {
    const tick = (timestamp: number) => {
      if (!isPausedRef.current && lastTimestampRef.current !== null) {
        const raw   = timestamp - lastTimestampRef.current
        const delta = raw * (isFastForwardRef.current ? FAST_FORWARD_FACTOR : 1)
        const beat  = BEATS[currentBeatIndexRef.current]

        if (beat.duration > 0) {
          elapsedRef.current += delta
          const clamped = Math.min(elapsedRef.current / beat.duration, 1)
          setProgress(clamped)

          if (elapsedRef.current >= beat.duration) {
            const next = currentBeatIndexRef.current + 1
            if (next < BEATS.length) {
              elapsedRef.current          = 0
              currentBeatIndexRef.current = next
              setCurrentBeatIndex(next)
              setProgress(0)
            }
          }
        }
      }

      // Toujours mettre à jour le timestamp (même en pause) pour éviter
      // un delta géant à la reprise
      lastTimestampRef.current = timestamp
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ─── Contrôles ───────────────────────────────────────────────────────────────
  // Toutes les fonctions lisent/écrivent les refs, jamais l'état React
  // → stable sans deps, ne force pas de re-registration du listener clavier

  const goToNext = useCallback(() => {
    if (currentBeatIndexRef.current >= BEATS.length - 1) return
    elapsedRef.current = 0
    currentBeatIndexRef.current += 1
    setCurrentBeatIndex(currentBeatIndexRef.current)
    setProgress(0)
  }, [])

  const goToPrev = useCallback(() => {
    if (currentBeatIndexRef.current === 0) return
    elapsedRef.current = 0
    currentBeatIndexRef.current -= 1
    setCurrentBeatIndex(currentBeatIndexRef.current)
    setProgress(0)
  }, [])

  const togglePause = useCallback(() => {
    const next = !isPausedRef.current
    isPausedRef.current = next
    setIsPaused(next)
  }, [])

  const toggleFastForward = useCallback(() => {
    const next = !isFastForwardRef.current
    isFastForwardRef.current = next
    setIsFastForward(next)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }, [])

  // ─── Keybinds ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYBINDS.NEXT && !e.shiftKey) {
        e.preventDefault()
        goToNext()
      } else if (e.key === ' ' && e.shiftKey) {
        // Shift+Espace géré manuellement (KEYBINDS.PREV contient le label,
        // pas le e.key réel — voir constants/timeline.ts)
        e.preventDefault()
        goToPrev()
      } else if (e.key === KEYBINDS.FAST_FORWARD) {
        toggleFastForward()
      } else if (e.key === KEYBINDS.PAUSE) {
        togglePause()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goToNext, goToPrev, toggleFastForward, togglePause])

  // ─── Valeurs dérivées ─────────────────────────────────────────────────────────

  const currentBeat = BEATS[currentBeatIndex]
  const isLastBeat  = currentBeatIndex === BEATS.length - 1

  const geologicalDate = useMemo((): number | null => {
    switch (currentBeat.phase) {
      case 'context': return -420
      case 'zoomout': return Math.round(-375 + 374.6 * progress) // lerp(-375, -0.4)
      default:        return null
    }
  }, [currentBeat.phase, progress])

  return {
    currentBeatIndex,
    currentBeat,
    progress,
    isPaused,
    isFastForward,
    lang,
    geologicalDate,
    isLastBeat,
    goToNext,
    goToPrev,
    togglePause,
    toggleFastForward,
    setLang,
  }
}
