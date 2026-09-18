import type { ReactNode } from 'react'
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

/** Rend `*mot*` en <em>. Aucune autre syntaxe : le contenu reste lisible brut. */
export default function RichText({ text, as: Tag = 'p', className, reveal = false, delay }: RichTextProps) {
  const parts = text.split('*')
  const children: ReactNode[] = parts.map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part))
  if (reveal && (Tag === 'p' || Tag === 'h1' || Tag === 'h2' || Tag === 'h3' || Tag === 'span')) {
    return (
      <RevealText as={Tag} className={className} delay={delay}>
        {children}
      </RevealText>
    )
  }
  return <Tag className={className}>{children}</Tag>
}
