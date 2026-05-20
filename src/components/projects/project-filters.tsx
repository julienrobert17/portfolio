'use client'

import { useRouter } from 'next/navigation'

interface ProjectFiltersProps {
  tags: string[]
  activeTag?: string
}

export default function ProjectFilters({ tags, activeTag }: ProjectFiltersProps) {
  const router = useRouter()

  const base = 'rounded-full px-4 py-1.5 text-sm font-medium transition-colors'
  const active = 'bg-[#534AB7] text-white'
  const inactive = 'border border-zinc-200 text-zinc-600 hover:bg-zinc-100'

  return (
    <div className="flex flex-wrap gap-2 mb-10">
      <button
        onClick={() => router.push('/projects')}
        className={`${base} ${!activeTag ? active : inactive}`}
      >
        Tous
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => router.push(`/projects?tag=${encodeURIComponent(tag)}`)}
          className={`${base} ${activeTag === tag ? active : inactive}`}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
