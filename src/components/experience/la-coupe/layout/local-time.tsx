'use client'

import { useEffect, useState } from 'react'
import { site } from '../content/site'

interface LocalTimeProps {
  className?: string
}

const FORMAT = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: site.fuseau,
})

/**
 * Heure locale de l'atelier, mise à jour à chaque minute pleine. Rendue
 * vide côté serveur pour ne jamais afficher l'heure du visiteur par erreur.
 */
export default function LocalTime({ className }: LocalTimeProps) {
  const [heure, setHeure] = useState<string | null>(null)

  useEffect(() => {
    let timer: number
    const tick = () => {
      const maintenant = new Date()
      setHeure(FORMAT.format(maintenant).replace(':', ':'))
      timer = window.setTimeout(tick, 60_000 - (maintenant.getSeconds() * 1000 + maintenant.getMilliseconds()))
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <span className={className} aria-label={heure ? `Il est ${heure} à ${site.ville}` : undefined}>
      <span aria-hidden={!heure}>{heure ?? '--:--'}</span>
      {' — '}
      {site.ville}
    </span>
  )
}
