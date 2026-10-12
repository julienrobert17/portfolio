'use client'

import type { CSSProperties } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { MARQUE } from '../lib/marque'
import { bpmCourant, useLecteur } from '../store/lecteur-store'

export const TEXTE_REPOS = 'GROOVE TO GRAVE RECORDS · PARIS · INSÈRE UNE CASSETTE · DU SILLON À LA TOMBE'

/** Texte de la bande : ce qui joue, puis le label. Partagé avec la région annoncée. */
export function texteBande(etat: ReturnType<typeof useLecteur>, prochaine?: string): string {
  const p = etat.piste
  // Fin de bande : la barre mobile n'a pas de compteurs, la bande le dit en tête.
  const fin = etat.finDeBande ? 'FIN DE BANDE · REMBOBINER POUR REMONTER · ' : ''
  if (!p) return `${fin}${TEXTE_REPOS}${prochaine ? ` · ${prochaine}` : ''}`
  const marque = etat.statut === 'lecture' ? '▶' : etat.statut === 'pause' ? 'Ⅱ' : '■'
  const origine = p.origine === 'provisoire' ? ' · EXTRAIT PROVISOIRE' : ''
  return `${fin}${marque} ${p.catalog} · ${p.artiste.toUpperCase()} · ${p.position} ${p.titre.toUpperCase()}${origine} · ${p.format.toUpperCase()} · DISPO SUR BANDCAMP · ${MARQUE.nom.toUpperCase()} · PARIS${prochaine ? ` · ${prochaine}` : ''}`
}

/**
 * La bande défilante de l'afficheur, en VT323, à une vitesse proportionnelle au BPM ; elle
 * s'arrête quand la lecture s'arrête, se met en pause au survol et au focus. aria-hidden : son
 * contenu est annoncé par la région aria-live du lecteur. Mouvement réduit : statique, tronquée.
 * Quand l'extrait est indisponible, elle laisse la place au message d'échec et au lien Bandcamp.
 */
export default function BandeDefilante({ prochaine }: { prochaine?: string }) {
  const etat = useLecteur()
  const reduit = useReducedMotion()
  const texte = texteBande(etat, prochaine)
  const joue = etat.statut === 'lecture'
  // Extrait indisponible : l'afficheur le dit en clair et renvoie sur Bandcamp, au lieu de souffler
  // dans le vide. Visible et annoncé, contrairement à la bande ordinaire (bloc 7.5a).
  if (etat.echec) {
    return (
      <div className="g2g-bande g2g-bande--echec g2g-lcd-texte" role="status" data-g2g="echec" title={etat.echec}>
        <span>EXTRAIT INDISPONIBLE</span>
        <a href={etat.piste?.bandcamp ?? MARQUE.bandcamp} rel="noopener" aria-label="Écouter cette sortie sur Bandcamp" data-g2g="echec-bandcamp">
          BANDCAMP
        </a>
      </div>
    )
  }
  if (reduit || !joue) {
    return (
      <div className="g2g-bande g2g-bande--statique g2g-lcd-texte" aria-hidden="true" title={texte}>
        {texte}
      </div>
    )
  }
  const duree = (60 / bpmCourant()) * 40
  return (
    <div className="g2g-bande g2g-lcd-texte" aria-hidden="true" style={{ '--duree': `${duree.toFixed(1)}s` } as CSSProperties}>
      <div className="g2g-bande__piste">
        <span>{texte} ··· </span>
        <span>{texte} ··· </span>
      </div>
    </div>
  )
}
