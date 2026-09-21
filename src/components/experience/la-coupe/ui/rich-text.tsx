import type { ReactNode } from 'react'
import { typo } from '../lib/typo'
import RevealText from './reveal-text'

interface RichTextProps {
  /** Texte où les *segments entre astérisques* passent en italique serif. */
  text: string
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'li' | 'blockquote'
  className?: string
  /** Révélation par lignes au scroll (RevealText). */
  reveal?: boolean
  delay?: number
}

/** Ponctuation qui, collée à un italique, ne doit jamais passer seule à la ligne. */
const COLLEE = /^[.,…)\]]+/

/**
 * Rend `*mot*` en <em>. Aucune autre syntaxe : le contenu reste lisible brut.
 * La ponctuation qui suit aussitôt un italique reste avec son dernier mot :
 * les deux partent dans un `.lc-colle` (white-space: nowrap), sinon un point
 * peut se retrouver seul en début de ligne.
 */
export default function RichText({ text, as: Tag = 'p', className, reveal = false, delay }: RichTextProps) {
  const parts = typo(text).split('*')
  const children: ReactNode[] = []
  // Ce que l'italique précédent a déjà pris au fragment courant.
  let rogne = 0
  parts.forEach((part, i) => {
    const contenu = part.slice(rogne)
    rogne = 0
    if (i % 2 === 0) {
      if (contenu) children.push(contenu)
      return
    }
    const ponctuation = (parts[i + 1] ?? '').match(COLLEE)?.[0] ?? ''
    if (!ponctuation) {
      children.push(<em key={i}>{contenu}</em>)
      return
    }
    rogne = ponctuation.length
    const coupe = contenu.lastIndexOf(' ')
    const debut = coupe >= 0 ? contenu.slice(0, coupe + 1) : ''
    const dernier = coupe >= 0 ? contenu.slice(coupe + 1) : contenu
    if (debut) children.push(<em key={`${i}-debut`}>{debut}</em>)
    children.push(
      <span key={i} className="lc-colle">
        <em>{dernier}</em>
        {ponctuation}
      </span>,
    )
  })
  if (reveal && (Tag === 'p' || Tag === 'h1' || Tag === 'h2' || Tag === 'h3' || Tag === 'span')) {
    return (
      <RevealText as={Tag} className={className} delay={delay}>
        {children}
      </RevealText>
    )
  }
  return <Tag className={className}>{children}</Tag>
}
