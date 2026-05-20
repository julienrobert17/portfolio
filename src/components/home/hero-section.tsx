import Link from 'next/link'
import Typewriter from '@/components/ui/typewriter'
import Reveal from '@/components/ui/reveal'

const stack = ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Claude Code', 'Docker']

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden flex flex-col items-start gap-8 py-24 px-6 max-w-3xl mx-auto">
      {/* Dot grid */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,rgba(83,74,183,0.08)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Badge */}
      <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
        </span>
        Disponible — Open to work
      </div>

      {/* Title */}
      <h1 className="text-5xl font-semibold tracking-tight leading-tight">
        Julien Robert
        <br />
        <Typewriter text="Développeur" delay={60} className="text-[#534AB7]" />
        <br />
        Full Stack
      </h1>

      {/* Subtitle */}
      <p className="text-lg leading-8 text-zinc-600 max-w-xl">
        Je conçois des applications web robustes et soignées, du backend à l&apos;interface.
      </p>

      {/* CTAs */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/projects"
          className="rounded-full bg-[#1a1a1a] text-white dark:bg-white dark:text-[#1a1a1a] px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
        >
          Voir mes projets
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100"
        >
          Me contacter
        </Link>
      </div>

      {/* Stack pills */}
      <Reveal className="flex flex-wrap gap-2">
        {stack.map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {tech}
          </span>
        ))}
      </Reveal>
    </section>
  )
}
