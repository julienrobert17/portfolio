import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await prisma.project.findUnique({ where: { slug } })

  if (!project) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">

      {/* Back */}
      <Link
        href="/projects"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Projets
      </Link>

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

      {/* Links */}
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

    </main>
  )
}
