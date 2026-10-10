'use client'

import type { MouseEvent } from 'react'
import { getLenis } from '../lib/lenis-store'
import { rembobiner } from '../store/lecteur-store'

/** « Rembobiner » : ancre vers le haut de page sans JavaScript ; avec, le son de rembobinage et un défilement doux. */
export default function BoutonRembobiner() {
  const auClic = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    rembobiner()
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { duration: 0.9 })
    else window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    document.getElementById('haut')?.focus({ preventScroll: true })
  }
  return (
    <a href="#haut" className="g2g-bouton g2g-bouton--principal" data-g2g="rembobiner" onClick={auClic}>
      Rembobiner
    </a>
  )
}
