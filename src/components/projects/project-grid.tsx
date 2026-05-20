import type { Project } from '@prisma/client'
import Link from 'next/link'
import Reveal from '@/components/ui/reveal'

interface ProjectGridProps {
  projects: Project[]
}

export default function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-zinc-500">Aucun projet pour ce tag.</p>
        <Link
          href="/projects"
          className="text-sm font-medium underline underline-offset-4 text-[#534AB7]"
        >
          Voir tous les projets
        </Link>
      </div>
    )
  }

  return (
    <Reveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <article
          key={project.id}
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-5"
        >
          <div className="flex flex-col gap-1 flex-1">
            <h2 className="font-semibold text-base">{project.title}</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">{project.description}</p>
          </div>

          <div className="flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>

          {(project.githubUrl || project.liveUrl) && (
            <div className="flex gap-3 text-sm font-medium">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
                >
                  GitHub
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#534AB7] underline underline-offset-4 hover:opacity-80"
                >
                  Voir le site
                </a>
              )}
            </div>
          )}
        </article>
      ))}
    </Reveal>
  )
}
