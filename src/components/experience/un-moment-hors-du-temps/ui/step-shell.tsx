'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import styles from '../invitation.module.css'

interface StepShellProps {
  /** Change à chaque écran : force le remontage, donc rejoue l'animation. */
  stepKey: string
  direction: 1 | -1
  children: ReactNode
}

export default function StepShell({ stepKey, direction, children }: StepShellProps) {
  const ref = useRef<HTMLDivElement>(null)

  /*
   * Le conteneur défilant (le <main> plein écran) ne se remonte jamais : il
   * gardait donc le scrollTop de l'étape précédente, et un écran pouvait
   * s'ouvrir déjà défilé en bas. On le ramène en haut avant l'animation
   * d'entrée, à chaque changement d'étape.
   */
  useEffect(() => {
    let node: HTMLElement | null = ref.current
    while (node) {
      const overflowY = getComputedStyle(node).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') {
        node.scrollTop = 0
        break
      }
      node = node.parentElement
    }
    window.scrollTo(0, 0)
  }, [stepKey])

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      <section
        key={stepKey}
        className={`${styles.card} ${direction === 1 ? styles.enter : styles.enterBack}`}
      >
        {children}
      </section>
    </div>
  )
}
