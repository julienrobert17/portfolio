'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'
import { naviguer, type TypeTransition } from '../lib/navigation-store'

interface LienTransitionProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string
  /** `partage` : l'image portant le nom de vue du projet s'étire vers le hero de la fiche. */
  type?: TypeTransition
  /** Nom de la destination pour le rideau (sinon déduit du texte du lien). */
  label?: string
}

/**
 * Lien Next qui passe par PageTransition : rideau ou élément partagé. Les
 * clics modifiés (nouvel onglet) et le sans-JS gardent la navigation native.
 */
export default function LienTransition({ href, type = 'rideau', label, onClick, children, ...props }: LienTransitionProps) {
  const auClic = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    naviguer({ href, type, label: label ?? e.currentTarget.textContent?.trim() ?? '' })
  }
  return (
    <Link href={href} onClick={auClic} transitionTypes={[type]} {...props}>
      {children}
    </Link>
  )
}
