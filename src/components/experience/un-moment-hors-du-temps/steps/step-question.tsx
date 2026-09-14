'use client'

import { useState } from 'react'
import PaperButton from '../ui/paper-button'
import SincereModal from '../ui/sincere-modal'
import styles from '../invitation.module.css'
import { COPY } from '../content'
import { useDodge } from '../use-dodge'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import type { StepProps } from './step-props'

/** Nombre d'esquives après lequel le Non se pose. La porte de sortie. */
const MAX_DODGES = 7
/** Le Oui grossit, mais jamais au point de casser la mise en page. */
const YES_MAX_SCALE = 1.35
/* Plancher haut : la sortie de secours ne doit pas être la plus petite
 * cible de l'écran au moment précis où elle sert. */
const NO_MIN_SCALE = 0.88

type Rgb = readonly [number, number, number]
const TERRACOTTA: Rgb = [168, 95, 66]
const GOLD: Rgb = [201, 162, 39]
const CREAM: Rgb = [255, 250, 241]
const INK: Rgb = [46, 42, 38]

const mix = (from: Rgb, to: Rgb, t: number) =>
  `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * t)).join(' ')})`
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export default function StepQuestion({ machine }: StepProps) {
  const copy = COPY.step2
  const reduced = useReducedMotion()
  const [askingSincerely, setAskingSincerely] = useState(false)

  const { buttonRef, zoneRef, dodges, settled } = useDodge({
    maxDodges: MAX_DODGES,
    reducedMotion: reduced,
  })

  const label = copy.noLabels[Math.min(dodges, copy.noLabels.length - 1)]
  const insistence = clamp01(dodges / MAX_DODGES)
  const yesScale = Math.min(1 + dodges * 0.05, YES_MAX_SCALE)
  const noScale = settled ? 1 : Math.max(1 - dodges * 0.02, NO_MIN_SCALE)

  const sayYes = () => {
    machine.setAnswers({ yes: true })
    machine.next()
  }

  return (
    <>
      <h1 className={styles.title}>{copy.question}</h1>

      <div className={styles.duel}>
        {/*
         * Le Oui grandit en `scale` dans une case de taille fixe : la carte
         * garde ses dimensions, donc rien autour ne bouge quand il enfle.
         */}
        <div className={styles.yesSlot}>
          <PaperButton
            className={`${styles.btnYes} ${dodges > 0 ? styles.yesPulse : ''}`}
            style={{
              transform: `scale(${yesScale})`,
              // Dérive terracotta → doré ; le texte passe au brun pour rester lisible.
              backgroundColor: mix(TERRACOTTA, GOLD, insistence),
              color: mix(CREAM, INK, clamp01((insistence - 0.2) / 0.4)),
              animationDuration: `${2000 - dodges * 140}ms`,
            }}
            onClick={sayYes}
          >
            {copy.yes}
          </PaperButton>
        </div>

        <div ref={zoneRef} className={styles.dodgeZone}>
          <button
            ref={buttonRef}
            type="button"
            className={`${styles.btn} ${styles.btnNo}`}
            style={{
              fontSize: `${16 * noScale}px`,
              padding: `${14 * noScale}px ${22 * noScale}px`,
              minHeight: `${48 * noScale}px`,
            }}
            /*
             * Toujours actif : le moteur d'esquive empêche le pointeur
             * d'atterrir, mais Tab + Entrée fonctionnent dès le premier écran.
             */
            onClick={() => setAskingSincerely(true)}
          >
            {label}
          </button>
        </div>
      </div>

      <div aria-live="polite">
        {settled && <p className={styles.note}>{copy.noSettled}</p>}
      </div>
      <p className={`${styles.aside} ${styles.keyboardOnly}`}>{copy.keyboardHint}</p>

      {askingSincerely && (
        <SincereModal titleId="hdt-sincere" onClose={() => setAskingSincerely(false)}>
          <h2 className={styles.modalTitle} id="hdt-sincere">
            {copy.modal.title}
          </h2>
          <p className={styles.modalBody}>{copy.modal.body}</p>
          <div className={styles.modalActions}>
            <PaperButton onClick={() => setAskingSincerely(false)}>
              {copy.modal.joke}
            </PaperButton>
            <PaperButton
              variant="ghost"
              onClick={() => {
                machine.setAnswers({ yes: false })
                machine.go('refused', 1)
              }}
            >
              {copy.modal.real}
            </PaperButton>
          </div>
        </SincereModal>
      )}
    </>
  )
}
