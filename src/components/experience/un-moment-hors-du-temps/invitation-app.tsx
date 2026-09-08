'use client'

import ProgressBar from './ui/progress-bar'
import { CelebrationProvider, useCelebration } from './celebration-context'
import { useKonami, useTapSecret } from './use-konami'
import StepShell from './ui/step-shell'
import styles from './invitation.module.css'
import { useInvitationMachine } from './use-invitation-machine'
import StepEnvelope from './steps/step-envelope'
import StepIdentity from './steps/step-identity'
import StepQuestion from './steps/step-question'
import StepDate from './steps/step-date'
import StepTime from './steps/step-time'
import StepActivity from './steps/step-activity'
import StepTerms from './steps/step-terms'
import StepConfirm from './steps/step-confirm'
import ScreenRefused from './steps/screen-refused'
import type { StepProps } from './steps/step-props'
import type { ComponentType } from 'react'

const STEPS: readonly ComponentType<StepProps>[] = [
  StepEnvelope,
  StepIdentity,
  StepQuestion,
  StepDate,
  StepTime,
  StepActivity,
  StepTerms,
  StepConfirm,
]

export default function InvitationApp() {
  return (
    <CelebrationProvider>
      <InvitationAppInner />
    </CelebrationProvider>
  )
}

function InvitationAppInner() {
  const machine = useInvitationMachine()
  const { rain } = useCelebration()
  const onSecretTap = useTapSecret(5, 1800, rain)

  useKonami(rain)

  const screen = machine.screen
  const Step = screen === 'refused' ? ScreenRefused : STEPS[screen]

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        {screen !== 'refused' && <ProgressBar step={screen} onSecretTap={onSecretTap} />}
        <StepShell
          stepKey={String(screen)}
          direction={machine.direction}
        >
          <Step machine={machine} />
        </StepShell>
      </div>
    </div>
  )
}
