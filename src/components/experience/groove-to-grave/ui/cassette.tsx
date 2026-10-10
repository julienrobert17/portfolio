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

/** Texte lisible sur une couleur : ink si son contraste y atteint 3:1, sinon poster. */
function encreSur(contrasteInk: number): string {
  return contrasteInk >= 3 ? tokens.ink : tokens.poster
}

interface CassetteSvgProps {
  coque: string
  etiquette: string
  bande: string
  /** Référence ou date dans la bande. */
  reference: string
  face?: string
  ligne1: string
  ligne2: string
  texteBande: string
}

/**
 * La cassette, SVG en ligne aux proportions de la maquette (200 × 128), décorative : le nom
 * accessible vient du lien ou du texte voisin. Coque et bande colorées depuis la pochette ;
 * l'étiquette reste poster. Bobines fixes en Phase 2.
 */
export function CassetteSvg({ coque, etiquette, bande, reference, face = 'A', ligne1, ligne2, texteBande }: CassetteSvgProps) {
  return (
    <svg viewBox="0 0 200 128" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="196" height="124" rx="8" fill={coque} stroke={tokens.ink} strokeWidth="2.5" />
      {[11, 189].flatMap((cx) => [11, 117].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" fill={tokens.ink} />))}
      <rect x="16" y="10" width="168" height="68" rx="3" fill={etiquette} stroke={tokens.ink} strokeWidth="1.2" />
      <rect x="16" y="10" width="168" height="13" fill={bande} />
      <text x="22" y="20.5" fontSize="10" fontWeight="800" fill={texteBande} style={{ fontFamily: 'var(--g2g-font-archivo), Archivo, sans-serif', fontStretch: '80%', letterSpacing: 0.3 }}>
        {reference}
      </text>
      <text x="178" y="20.5" textAnchor="end" fontSize="10" fontWeight="800" fill={texteBande} style={{ fontFamily: 'var(--g2g-font-archivo), Archivo, sans-serif' }}>
        {face}
      </text>
      <text x="22" y="38" fontSize="13" fill={tokens.ink} style={{ fontFamily: 'var(--g2g-font-marker), Permanent Marker, cursive' }}>
        {ligne1}
      </text>
      <text x="22" y="51" fontSize="10" fill={tokens.ink} style={{ fontFamily: 'var(--g2g-font-marker), Permanent Marker, cursive' }}>
        {ligne2}
      </text>
      <rect x="52" y="56" width="96" height="18" rx="9" fill={tokens.ink} />
      {[72, 128].map((cx) => (
        <g key={cx} className="g2g-bobine">
          <circle cx={cx} cy="65" r="7" fill={tokens.poster} />
          <path d={`M${cx} 58.5v13M${cx - 5.6} 61.8l11.2 6.4M${cx - 5.6} 68.2l11.2-6.4`} stroke={tokens.ink} strokeWidth="1.6" />
        </g>
      ))}
      <polygon points="42,126 54,96 146,96 158,126" fill={coque} stroke={tokens.ink} strokeWidth="1.5" />
      <circle cx="72" cy="112" r="4" fill={tokens.ink} />
      <circle cx="128" cy="112" r="4" fill={tokens.ink} />
    </svg>
  )
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
 * Cassette d'une sortie : un lien vers sa page (fonctionne sans JavaScript), avec le format
 * et le statut en texte à côté, et un sticker pour l'épuisé. Deuxième cible distincte : le
 * bouton rond « écouter », rendu seulement si JavaScript est actif et qu'un extrait existe.
 */
export default function Cassette({ sortie, amplitude = 4 }: CassetteProps) {
  const c = couleursCassette(sortie.ref)
  const statut = sortie.status === 'epuise' ? 'épuisé' : sortie.noRepress ? 'no repress' : null
  const piste = pisteJouable(sortie)
  return (
    <TuileJouable sortieRef={sortie.ref}>
      <Link href={routes.sortie(sortie.ref)} className="g2g-cassette" style={styleRotation(sortie.ref, amplitude)} aria-label={`${sortie.catalog}, ${sortie.artistName}, ${sortie.title}`}>
        <CassetteSvg coque={c.coque} etiquette={tokens.poster} bande={c.bande} texteBande={c.texteBande} reference={sortie.catalog} ligne1={court(sortie.artistName, 22)} ligne2={court(sortie.title, 30)} />
        <span className="g2g-cassette__texte">
          <span>
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
    <div className="g2g-cassette" style={{ '--rot': '-3deg', maxWidth: 360 } as React.CSSProperties}>
      <CassetteSvg coque={tokens.poster} etiquette={tokens.poster} bande={tokens.red} texteBande={tokens.ink} reference="DÉMO" face="?" ligne1="envoie ta tape" ligne2="lien d'écoute privé, pas de fichier" />
    </div>
  )
}
