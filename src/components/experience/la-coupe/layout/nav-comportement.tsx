'use client'

import { useEffect, useRef } from 'react'
import { getLenis } from '../lib/lenis-store'

const SEUIL = 80

/**
 * La nav se cache au défilement vers le bas et réapparaît vers le haut ;
 * le nom cède la place aux initiales après un viewport. Direction lue
 * depuis Lenis quand il tourne, sinon depuis la fenêtre.
 */
export default function NavComportement() {
  const ancre = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const header = ancre.current?.closest('header')
    if (!header) return
    let precedent = window.scrollY
    let ticket = 0
    const lire = () => {
      ticket = 0
      const y = window.scrollY
      const lenis = getLenis()
      const direction = lenis ? lenis.direction : Math.sign(y - precedent)
      precedent = y
      const cachee = direction > 0 && y > SEUIL
      const reduite = y > window.innerHeight
      if (header.dataset.cachee !== String(cachee)) header.dataset.cachee = String(cachee)
      if (header.dataset.reduite !== String(reduite)) header.dataset.reduite = String(reduite)
    }
    const onScroll = () => {
      if (!ticket) ticket = window.requestAnimationFrame(lire)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    lire()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (ticket) window.cancelAnimationFrame(ticket)
      delete header.dataset.cachee
      delete header.dataset.reduite
    }
  }, [])

  return <span ref={ancre} hidden />
}
