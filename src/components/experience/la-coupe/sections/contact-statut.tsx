'use client'

import { useEffect, useState } from 'react'
import { site } from '../content/site'

interface ContactStatutProps {
  className?: string
}

const { ouverture, statut } = site.contact

const HEURE = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: site.fuseau })
/** Jour de la semaine et heure à Paris, quel que soit le fuseau du visiteur. */
const PARTS = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', hour12: false, timeZone: site.fuseau })
const JOURS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Phrase d'état de l'atelier, d'après l'heure de Paris et les horaires du contenu. */
function lire(maintenant: Date): string {
  const parts = PARTS.formatToParts(maintenant)
  const jour = JOURS.indexOf(parts.find((p) => p.type === 'weekday')?.value ?? '')
  const heure = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const ouvre = ouverture.jours.includes(jour)
  if (ouvre && heure >= ouverture.debut && heure < ouverture.fin) {
    return `${statut.ouvert} — ${HEURE.format(maintenant)} ${statut.aParis.replace('{ville}', site.ville)}`
  }
  // Fermé : la réponse vient à la prochaine ouverture, demain ou lundi.
  const prochain = ouvre && heure < ouverture.debut ? jour : (jour + 1) % 7
  const demain = ouverture.jours.includes(prochain)
  return `${statut.ferme} — ${demain ? statut.demain : statut.lundi}`
}

/**
 * Statut vivant de l'atelier, sous le titre de la page contact. Rendu vide
 * côté serveur : l'heure de Paris n'a de sens qu'une fois montée, et le HTML
 * statique serait périmé. Mis à jour à chaque minute pleine.
 */
export default function ContactStatut({ className }: ContactStatutProps) {
  const [texte, setTexte] = useState<string | null>(null)

  useEffect(() => {
    let timer: number
    const tick = () => {
      const maintenant = new Date()
      setTexte(lire(maintenant))
      timer = window.setTimeout(tick, 60_000 - (maintenant.getSeconds() * 1000 + maintenant.getMilliseconds()))
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [])

  // Hauteur réservée par la ligne vide : rien ne bouge à l'arrivée du texte.
  return (
    <p className={className} role="status" aria-live="polite">
      {texte ?? ' '}
    </p>
  )
}
