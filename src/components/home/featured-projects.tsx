import type { Project } from '@prisma/client'
import Link from 'next/link'

interface FeaturedProjectsProps {
  projects: Project[]
}

export default function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-10">Projets</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <article key={project.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-5">
            <h3 className="font-semibold text-lg">{project.title}</h3>
            <p className="text-sm text-zinc-500 flex-1">{project.description}</p>
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {tag}
                </span>
              ))}
            </div>
            <Link href={`/projects/${project.slug}`} className="text-sm font-medium underline underline-offset-4">
              Voir le projet →
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
