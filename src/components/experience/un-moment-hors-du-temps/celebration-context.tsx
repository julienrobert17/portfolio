'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { burstConfetti, emojiRain } from './confetti'
import { useReducedMotion } from './use-reduced-motion'
import styles from './invitation.module.css'

/** La palette de l'expérience, en version projectile. */
const COLORS = ['#C97B5A', '#8FA98B', '#C9A227', '#EFE6D6', '#A85F42']
const EMOJIS = ['🐈', '🍷', '💍', '🥐', '🌙', '🎧', '🧀', '✨']

interface Celebration {
  /** Salve de confettis. Silencieuse si l'utilisatrice a demandé moins d'animations. */
  celebrate: () => void
  /** Pluie d'emojis de l'easter egg. */
  rain: () => void
}

const CelebrationContext = createContext<Celebration>({
  celebrate: () => {},
  rain: () => {},
})

export function useCelebration(): Celebration {
  return useContext(CelebrationContext)
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    return () => {
      cancelRef.current?.()
      cancelRef.current = null
    }
  }, [])

  const run = useCallback(
    (start: (canvas: HTMLCanvasElement) => () => void) => {
      // prefers-reduced-motion : on ne lance rien du tout.
      if (reduced) return
      const canvas = canvasRef.current
      if (!canvas) return
      cancelRef.current?.()
      cancelRef.current = start(canvas)
    },
    [reduced],
  )

  const value = useMemo<Celebration>(
    () => ({
      celebrate: () => run((canvas) => burstConfetti(canvas, { colors: COLORS })),
      rain: () => run((canvas) => emojiRain(canvas, EMOJIS)),
    }),
    [run],
  )

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </CelebrationContext.Provider>
  )
}
