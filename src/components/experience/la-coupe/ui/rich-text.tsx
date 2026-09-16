import type { ReactNode } from 'react'

interface RichTextProps {
  /** Texte où les *segments entre astérisques* passent en italique serif. */
  text: string
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'li' | 'blockquote'
  className?: string
}

/** Rend `*mot*` en <em>. Aucune autre syntaxe : le contenu reste lisible brut. */
export default function RichText({ text, as: Tag = 'p', className }: RichTextProps) {
  const parts = text.split('*')
  const children: ReactNode[] = parts.map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : part,
  )
  return <Tag className={className}>{children}</Tag>
}
