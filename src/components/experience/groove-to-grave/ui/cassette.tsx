import Link from 'next/link'
import { extraits } from '../content/extraits'
import { medias } from '../content/medias'
import type { PisteJouable } from '../store/lecteur-store'
import { couleurs } from '../content/couleurs'
import type { Sortie } from '../content/types'
import { styleRotation } from '../lib/desordre'
import { routes } from '../lib/routes'
import { couleurs as tokens } from '../tokens'
import BoutonEcouter, { TuileJouable } from './cassette-jouable'
import { CassetteSvg } from './cassette-svg'

export { CassetteSvg } from './cassette-svg'

/** Texte lisible sur une couleur : ink si son contraste y atteint 3:1, sinon poster. */
function encreSur(contrasteInk: number): string {
  return contrasteInk >= 3 ? tokens.ink : tokens.poster
}

/** Couleurs de cassette d'une sortie, ou un repli neutre si la pochette n'a pas été traitée. */
export function couleursCassette(ref: string) {
  const c = couleurs[ref]
  if (!c) return { coque: tokens.chrome, bande: tokens.ink, texteBande: tokens.poster }
  return { coque: c.dominant, bande: c.accent, texteBande: encreSur(c.contrasteInk.accent) }
}

/** Tronque un texte au marqueur pour tenir sur l'étiquette (brief : jamais plus de six mots). */
function court(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

interface CassetteProps {
  sortie: Sortie
  /** Amplitude de rotation en degrés, 0 pour aucune. */
  amplitude?: number
  priorite?: boolean
}

/** Première piste jouable d'une sortie, sérialisée pour le lecteur ; null sans extrait. */
export function pisteJouable(sortie: Sortie, piste = sortie.tracks.find((t) => extraits[t.id])): PisteJouable | null {
  if (!piste) return null
  const extrait = extraits[piste.id]
  if (!extrait) return null
  const c = couleursCassette(sortie.ref)
  return {
    id: piste.id,
    sortieRef: sortie.ref,
    catalog: sortie.catalog,
    artiste: piste.artist ?? sortie.artistName,
    titre: piste.title,
    position: piste.position,
    format: sortie.format,
    src: extrait.src,
    duration: extrait.duration,
    bpm: extrait.bpm ?? sortie.bpmProvisoire,
    origine: extrait.origine,
    genres: sortie.genres,
    bandcamp: sortie.links.bandcamp,
    coque: c.coque,
    bande: c.bande,
    texteBande: c.texteBande,
    pochette: medias[sortie.ref] ? sortie.ref : undefined,
  }
}

/**
 * Cassette d'une sortie : un lien vers sa page (fonctionne sans JavaScript), nommé par son texte
 * visible (référence masquée, artiste, titre, format, statut), avec un sticker pour l'épuisé. Deuxième cible distincte : le
 * bouton rond « écouter », rendu seulement si JavaScript est actif et qu'un extrait existe.
 */
export default function Cassette({ sortie, amplitude = 4 }: CassetteProps) {
  const c = couleursCassette(sortie.ref)
  const statut = sortie.status === 'epuise' ? 'épuisé' : sortie.noRepress ? 'no repress' : null
  const piste = pisteJouable(sortie)
  return (
    <TuileJouable sortieRef={sortie.ref}>
      <Link href={routes.sortie(sortie.ref)} className="g2g-cassette" style={styleRotation(sortie.ref, amplitude)}>
        <CassetteSvg coque={c.coque} etiquette={tokens.poster} bande={c.bande} texteBande={c.texteBande} reference={sortie.catalog} ligne1={court(sortie.artistName, 22)} ligne2={court(sortie.title, 30)} />
        <span className="g2g-cassette__texte">
          <span>
            <span className="g2g-cache">{sortie.catalog}, </span>
            <strong>{sortie.artistName}</strong>
            {sortie.title}
          </span>
          <span className="g2g-cassette__format">
            {sortie.format}
            {statut ? <span className="g2g-cache">, {statut}</span> : null}
          </span>
        </span>
      </Link>
      {statut ? (
        <span className={`g2g-sticker${statut === 'no repress' ? ' g2g-sticker--vert' : ''}`} aria-hidden="true">
          {statut}
        </span>
      ) : null}
      {piste ? <BoutonEcouter piste={piste} /> : null}
    </TuileJouable>
  )
}

/** Cassette vierge de la page contact : « envoie ta tape ». Décorative. */
export function CassetteVierge() {
  return (
    <div className="g2g-cassette" style={{ '--rot-base': '-3deg', maxWidth: 360 } as React.CSSProperties}>
      <CassetteSvg coque={tokens.poster} etiquette={tokens.poster} bande={tokens.red} texteBande={tokens.ink} reference="DÉMO" face="?" ligne1="envoie ta tape" ligne2="lien d'écoute privé, pas de fichier" />
    </div>
  )
}
