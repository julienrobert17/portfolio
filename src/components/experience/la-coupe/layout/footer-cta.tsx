'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { site } from '../content/site'

interface FooterCtaProps {
  children: ReactNode
}

/**
 * Bloc d'appel du footer (« Un projet ? » et l'adresse). La page contact le
 * porte déjà en tête, en plus grand : le footer y commence aux colonnes
 * d'informations. Partout ailleurs, il s'affiche.
 */
export default function FooterCta({ children }: FooterCtaProps) {
  const pathname = usePathname()
  if (pathname === `${site.base}/contact`) return null
  return <>{children}</>
}
