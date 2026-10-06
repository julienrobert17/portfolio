import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'content', 'case-studies')

export interface Heading {
  id: string
  text: string
}

export interface CaseStudy {
  quote: string
  stack: string | null
  duration: string | null
  role: string | null
  /** Markdown du corps, après le séparateur `---`. */
  body: string
  headings: Heading[]
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readMeta(head: string, label: string): string | null {
  const match = head.match(new RegExp(`^\\*\\*${label}\\*\\*\\s*:\\s*(.+)$`, 'm'))
  return match ? match[1].trim() : null
}

/** Slugs ayant un fichier content/case-studies/<slug>.md. */
export function listCaseStudySlugs(): string[] {
  if (!existsSync(DIR)) return []
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.slice(0, -3))
}

/** Lit et découpe content/case-studies/<slug>.md, ou null si absent. */
export function getCaseStudy(slug: string): CaseStudy | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  const file = path.join(DIR, `${slug}.md`)
  if (!existsSync(file)) return null

  const raw = readFileSync(file, 'utf8')
  const separator = raw.indexOf('\n---')
  const head = separator === -1 ? raw : raw.slice(0, separator)
  const body = (separator === -1 ? '' : raw.slice(separator + 4)).trim()

  const quote = head
    .split('\n')
    .filter((line) => line.startsWith('>'))
    .map((line) => line.replace(/^>\s?/, ''))
    .join(' ')
    .trim()

  const headings: Heading[] = [...body.matchAll(/^## (.+)$/gm)].map((m) => ({
    id: slugify(m[1]),
    text: m[1].trim(),
  }))

  return {
    quote,
    stack: readMeta(head, 'Stack'),
    duration: readMeta(head, 'Durée'),
    role: readMeta(head, 'Rôle'),
    body,
    headings,
  }
}
