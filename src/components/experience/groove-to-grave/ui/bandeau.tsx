import type { ReactNode } from 'react'
import type { Couleurs } from '../content/types'
import { contraste, melanger, couleurs as tokens } from '../tokens'

const MINIMUM = 4.5

/**
 * Fond et texte du bandeau d'une sortie : sa dominante, avec le texte (ink ou poster) qui y
 * contraste le mieux. Si aucun n'atteint 4,5:1 (texte de 13 à 16 px dans le bandeau), la
 * dominante est rapprochée de ce texte opposé par pas de 5 % jusqu'à y arriver : la pochette,
 * elle, reste intacte, seul l'aplat du bandeau bouge (GTGRVA02, vert à 4,1:1 sous ink).
 */
export function couleursBandeau(c: Couleurs | undefined): { fond: string; texte: string } {
  if (!c) return { fond: tokens.chrome, texte: tokens.ink }
  const surInk = contraste(c.dominant, tokens.ink)
  const surPoster = contraste(c.dominant, tokens.poster)
  const texte = surInk >= surPoster ? tokens.ink : tokens.poster
  const vers = texte === tokens.ink ? tokens.poster : tokens.ink
  let fond = c.dominant
  for (let t = 0.05; contraste(fond, texte) < MINIMUM && t <= 0.6; t += 0.05) fond = melanger(c.dominant, vers, t)
  return { fond, texte }
}

interface BandeauProps {
  /** Couleurs de la sortie dont la pochette donne la dominante ; sans couleurs, chrome et ink. */
  couleurs?: Couleurs
  children: ReactNode
}

/**
 * Bandeau de tête pleine largeur dans la dominante d'une pochette (pages sortie et artiste) :
 * mention, titre d'affiche, ligne de statut avec son sticker, fournis par la page.
 */
export default function Bandeau({ couleurs, children }: BandeauProps) {
  const { fond, texte } = couleursBandeau(couleurs)
  return (
    <header className="g2g-bandeau" style={{ background: fond, color: texte }}>
      {children}
    </header>
  )
}
