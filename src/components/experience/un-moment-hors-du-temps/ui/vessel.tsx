'use client'

import type { ReactNode } from 'react'

/**
 * Les silhouettes du CAPTCHA. Toutes des trapèzes à quelques détails près :
 * c'est volontaire, rien ne doit permettre de trancher ce qui est un seau.
 * Tracés inline, aucun asset réseau.
 */
const SHAPES: Record<string, ReactNode> = {
  seau: (
    <>
      <path d="M12 17 L36 17 L32 41 L16 41 Z" />
      <path d="M14 17 Q24 5 34 17" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </>
  ),
  bassine: <path d="M8 23 L40 23 L36 39 L12 39 Z" />,
  seille: (
    <>
      <path d="M13 15 L35 15 L31 41 L17 41 Z" />
      <rect x="14" y="23" width="20" height="2.4" fill="var(--paper)" />
    </>
  ),
  arrosoir: (
    <>
      <path d="M14 18 L34 18 L32 40 L16 40 Z" />
      <path d="M18 18 Q24 9 30 18" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </>
  ),
  pot: (
    <>
      <path d="M11 15 L37 15 L37 19.5 L11 19.5 Z" />
      <path d="M13 19.5 L35 19.5 L31 40 L17 40 Z" />
    </>
  ),
  saladier: <path d="M9 21 L39 21 A15 15 0 0 1 9 21 Z" />,
  marmite: (
    <>
      <path d="M12 15 L36 15 L36 18.5 L12 18.5 Z" />
      <path d="M14.5 18.5 L33.5 18.5 L33.5 40 L14.5 40 Z" />
      <rect x="9" y="22" width="4" height="2.4" />
      <rect x="35" y="22" width="4" height="2.4" />
    </>
  ),
  bac: <path d="M11 20 L37 20 L35 40 L13 40 Z" />,
  vase: <path d="M19 40 L29 40 L34 16 L14 16 Z" />,
}

interface VesselProps {
  kind: string
  size?: number
}

export default function Vessel({ kind, size = 46 }: VesselProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[kind] ?? SHAPES.seau}
    </svg>
  )
}
