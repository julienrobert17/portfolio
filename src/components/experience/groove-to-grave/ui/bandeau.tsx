import type { ReactNode } from 'react'
import { couleurs } from '../content/couleurs'
import { couleurs as tokens } from '../tokens'

/** Fond et texte du bandeau d'une sortie : sa dominante, texte ink si le contraste y atteint 4,5:1, sinon poster. */
export function couleursBandeau(ref: string | undefined): { fond: string; texte: string } {
  const c = ref ? couleurs[ref] : undefined
  if (!c) return { fond: tokens.chrome, texte: tokens.ink }
  return { fond: c.dominant, texte: c.contrasteInk.dominant >= 4.5 ? tokens.ink : tokens.poster }
}

interface BandeauProps {
  /** Référence de la sortie dont la pochette donne la couleur ; sans référence, chrome et ink. */
  sortieRef?: string
  children: ReactNode
}

/**
 * Bandeau de tête pleine largeur dans la dominante d'une pochette (pages sortie et artiste) :
 * mention, titre d'affiche, ligne de statut avec son sticker, fournis par la page.
 */
export default function Bandeau({ sortieRef, children }: BandeauProps) {
  const { fond, texte } = couleursBandeau(sortieRef)
  return (
    <header className="g2g-bandeau" style={{ background: fond, color: texte }}>
      {children}
    </header>
  )
}
