import { getProjects, getDistinctTags } from '@/lib/data'
import ProjectFilters from '@/components/projects/project-filters'
import ProjectGrid from '@/components/projects/project-grid'

type SearchParams = Promise<{ tag?: string }>

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { tag } = await searchParams

  const [projects, tags] = await Promise.all([
    getProjects(tag),
    getDistinctTags(),
  ])

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight mb-2">Projets</h1>
      <p className="text-zinc-500 mb-10">
        {projects.length} projet{projects.length !== 1 ? 's' : ''}
        {tag ? ` filtrés par "${tag}"` : ''}
      </p>

      <ProjectFilters tags={tags} activeTag={tag} />
      <ProjectGrid projects={projects} />
    </main>
  )
}
