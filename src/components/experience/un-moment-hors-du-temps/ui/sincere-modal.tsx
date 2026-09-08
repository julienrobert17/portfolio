'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import styles from '../invitation.module.css'

interface SincereModalProps {
  titleId: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'

/**
 * La seule modale de l'expérience. Contrairement au reste du repo, elle est
 * accessible : role/aria-modal, focus trap, Escape, restitution du focus,
 * scroll verrouillé. Aucun faux bouton de fermeture — Escape et le fond
 * ferment vraiment.
 */
export default function SincereModal({ titleId, onClose, children }: SincereModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus?.()
    }
  }, [])

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>
  )
}
