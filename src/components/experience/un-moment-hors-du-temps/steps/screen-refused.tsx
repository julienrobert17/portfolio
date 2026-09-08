'use client'

import PaperButton from '../ui/paper-button'
import styles from '../invitation.module.css'
import { COPY } from '../content'
import type { StepProps } from './step-props'

export default function ScreenRefused({ machine }: StepProps) {
  return (
    <>
      <h1 className={styles.title}>{COPY.refused.title}</h1>
      <p className={styles.subtitle}>{COPY.refused.body}</p>
      <p className={styles.aside}>{COPY.refused.signature}</p>
      <div className={styles.footer}>
        <PaperButton
          variant="quiet"
          onClick={() => {
            machine.setAnswers({ yes: null })
            machine.go(2, -1)
          }}
        >
          {COPY.refused.undo}
        </PaperButton>
      </div>
    </>
  )
}
