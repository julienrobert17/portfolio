import type { CSSProperties } from 'react'
import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getFeaturedProjects } from '@/lib/data'
import { accentStyle } from '@/lib/accents'
import { getCaseStudy } from '@/lib/case-studies'
import ScrollProgress from '@/components/ui/scroll-progress'
import CaseStudy from '@/components/projects/case-study'

interface Props {
  params: Promise<{ slug: string }>
}

const getProject = cache(async (slug: string) => prisma.project.findUnique({ where: { slug } }))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}
  const project = await getProject(slug)
  if (!project) return {}
  return { title: `${project.title} — Étude de cas`, description: study.quote }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) notFound()

  const study = getCaseStudy(slug)

  // Palette de la home : le header passe en clair sur /projects/*
  const mainStyle = {
    ...accentStyle(slug),
    '--background': '#0d271e',
    '--foreground': '#d0f0d2',
    backgroundColor: '#0d271e',
    color: '#d0f0d2',
  } as CSSProperties

  const backLink = (
    <Link
      href="/#realisations"
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      ← Projets
    </Link>
  )

  if (study) {
    const featured = await getFeaturedProjects()
    const index = featured.findIndex((p) => p.slug === slug)
    const prev = index > 0 ? featured[index - 1] : null
    const next = index >= 0 && index < featured.length - 1 ? featured[index + 1] : null

    return (
      <main className="flex-1 w-full max-w-[80rem] mx-auto px-6 py-16" data-project={slug} style={mainStyle}>
        <ScrollProgress />
        {backLink}
        <CaseStudy project={project} study={study} prev={prev} next={next} />
      </main>
    )
  }

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-16" data-project={slug} style={mainStyle}>
      <ScrollProgress />

      {/* Back */}
      {backLink}

      {/* Title */}
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-foreground">
        {project.title}
      </h1>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-3 py-1 rounded-full border border-border text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="mt-6 text-base text-muted-foreground leading-relaxed">
        {project.description}
      </p>

      {/* Links : rien du tout si le projet n'a ni démo ni dépôt */}
      {(project.liveUrl || project.githubUrl) && (
      <div className="mt-8 flex gap-4">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            {...(project.liveUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          >
            Voir le projet →
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border text-foreground px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            GitHub
          </a>
        )}
      </div>
      )}

    </main>
  )
}
