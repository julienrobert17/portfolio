'use client'

import type { ReactNode } from 'react'
import styles from '../invitation.module.css'

interface StepShellProps {
  /** Change à chaque écran : force le remontage, donc rejoue l'animation. */
  stepKey: string
  direction: 1 | -1
  children: ReactNode
}

export default function StepShell({ stepKey, direction, children }: StepShellProps) {
  return (
    <section
      key={stepKey}
      className={`${styles.card} ${direction === 1 ? styles.enter : styles.enterBack}`}
    >
      {children}
    </section>
  )
}
