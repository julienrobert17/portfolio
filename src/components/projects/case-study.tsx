import type { CSSProperties, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import Link from 'next/link'
import Markdown, { type Components } from 'react-markdown'
import type { Project } from '@prisma/client'
import type { CaseStudy as CaseStudyData } from '@/lib/case-studies'
import { slugify } from '@/lib/case-studies'
import CaseStudyToc from '@/components/projects/case-study-toc'

interface Props {
  project: Project
  study: CaseStudyData
  prev: Project | null
  next: Project | null
}

// Même rendu que les pills de tags des cartes projets
const pillStyle: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 9999,
  backgroundColor: 'rgba(4,18,11,0.65)',
  border: '1px solid color-mix(in oklch, var(--accent) 25%, transparent)',
  color: 'var(--accent)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}

const monoStyle: CSSProperties = {
  fontFamily: 'var(--font-geist-mono), monospace',
  fontSize: 12,
  letterSpacing: '0.06em',
  color: 'var(--accent-dim)',
}

function toText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return toText(node.props.children)
  return ''
}

/** Vrai si le premier enfant est un <strong> : "**Le symptôme.** Sur desktop…". */
function startsWithStrong(children: ReactNode): boolean {
  const first = Children.toArray(children)[0]
  return isValidElement(first) && first.type === 'strong'
}

function buildComponents(githubUrl: string | null): Components {
  const CaseLink: Components['a'] = ({ href, children }) => {
    // "#" dans le markdown = lien GitHub du projet, s'il existe
    const url = href === '#' ? githubUrl : href
    if (!url) return null
    const external = url.startsWith('http')
    return (
      <a href={url} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  }

  return {
    h2: ({ children }) => <h2 id={slugify(toText(children))}>{children}</h2>,
    a: CaseLink,
    p: ({ children }) => {
      const kids = Children.toArray(children)
      const elements = kids.filter(isValidElement)
      const onlyLinks =
        elements.length > 0 &&
        elements.every((el) => el.type === CaseLink) &&
        kids.every((k) => isValidElement(k) || (typeof k === 'string' && k.trim() === ''))
      if (onlyLinks) return <div className="case-study-actions">{elements}</div>
      return <p className={startsWithStrong(children) ? 'lead' : undefined}>{children}</p>
    },
    li: ({ children }) => (
      <li className={startsWithStrong(children) ? 'lead' : undefined}>{children}</li>
    ),
  }
}

export default function CaseStudy({ project, study, prev, next }: Props) {
  const meta = [study.stack, study.duration, study.role].filter(Boolean).join(' · ')

  return (
    <>
      <header style={{ maxWidth: '60rem', marginTop: 40 }}>
        <h1 style={{
          margin: 0,
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          fontSize: 'clamp(48px, 6vw, 80px)',
          color: '#d0f0d2',
        }}>
          {project.title}
        </h1>

        {project.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20 }}>
            {project.tags.map((tag) => (
              <span key={tag} style={pillStyle}>{tag}</span>
            ))}
          </div>
        )}

        {study.quote && (
          <p style={{
            margin: '32px 0 0',
            maxWidth: '46ch',
            fontSize: 'clamp(22px, 1.6vw, 24px)',
            lineHeight: 1.4,
            fontWeight: 500,
            color: '#d0f0d2',
          }}>
            {study.quote}
          </p>
        )}

        {meta && <p style={{ ...monoStyle, margin: '24px 0 0' }}>{meta}</p>}

        {(project.liveUrl || project.githubUrl) && (
          <p style={{ ...monoStyle, color: 'var(--accent)', margin: '10px 0 0', display: 'flex', gap: 20 }}>
            {project.liveUrl && <a href={project.liveUrl} style={{ color: 'inherit', textDecoration: 'none' }}>Voir le projet →</a>}
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                GitHub →
              </a>
            )}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr] lg:gap-16" style={{ marginTop: 72 }}>
        <CaseStudyToc headings={study.headings} />
        <article className="case-study" style={{ maxWidth: '68ch' }}>
          <Markdown components={buildComponents(project.githubUrl)}>{study.body}</Markdown>
        </article>
      </div>

      {(prev || next) && (
        <nav
          aria-label="Autres projets"
          className="flex flex-col gap-4 sm:flex-row sm:justify-between"
          style={{ marginTop: 96, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          {prev ? (
            <Link href={`/projects/${prev.slug}`} style={{ color: '#d0f0d2', textDecoration: 'none' }}>
              <span style={{ ...monoStyle, display: 'block', marginBottom: 6 }}>← Projet précédent</span>
              <span style={{ fontWeight: 600 }}>{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/projects/${next.slug}`} className="sm:text-right" style={{ color: '#d0f0d2', textDecoration: 'none' }}>
              <span style={{ ...monoStyle, display: 'block', marginBottom: 6 }}>Projet suivant →</span>
              <span style={{ fontWeight: 600 }}>{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </>
  )
}
