'use client'

import { basculer, useLecteur, type PisteJouable } from '../store/lecteur-store'
import IconePlay from './icone-play'

/** Bouton écouter d'une piste sur la page sortie, seulement là où un extrait existe ; caché sans JavaScript. */
export default function BoutonPiste({ piste }: { piste: PisteJouable }) {
  const etat = useLecteur()
  const joue = etat.piste?.id === piste.id && etat.statut === 'lecture'
  return (
    <button type="button" className="g2g-bouton-piste g2g-js" data-g2g="ecouter-piste" aria-pressed={joue} aria-label={`${joue ? 'Pause' : 'Écouter'} ${piste.position}, ${piste.titre}${piste.origine === 'provisoire' ? ', extrait provisoire' : ''}`} onClick={() => basculer(piste)}>
      <IconePlay pause={joue} />
      <span>{joue ? 'Pause' : 'Écouter'}</span>
    </button>
  )
}
