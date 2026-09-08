'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from '../invitation.module.css'

type Variant = 'primary' | 'ghost' | 'quiet'

interface PaperButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: `${styles.btn} ${styles.btnPrimary}`,
  ghost: `${styles.btn} ${styles.btnGhost}`,
  quiet: styles.btnQuiet,
}

export default function PaperButton({
  variant = 'primary',
  children,
  className,
  type = 'button',
  ...rest
}: PaperButtonProps) {
  return (
    <button
      type={type}
      className={`${variantClass[variant]}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  )
}
