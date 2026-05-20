import type { Experience } from '@prisma/client'

interface ExperiencesSectionProps {
  experiences: Experience[]
}

export default function ExperiencesSection({ experiences }: ExperiencesSectionProps) {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-10">Expériences</h2>
      <ul className="flex flex-col gap-8">
        {experiences.map((exp) => (
          <li key={exp.id} className="flex flex-col gap-2 border-l-2 border-zinc-200 pl-5">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-semibold text-lg">{exp.role}</h3>
              <span className="text-sm text-zinc-400 shrink-0">
                {exp.startDate.getFullYear()} — {exp.current ? 'présent' : exp.endDate?.getFullYear()}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-500">{exp.company}</p>
            <p className="text-sm text-zinc-600">{exp.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {exp.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {skill}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
