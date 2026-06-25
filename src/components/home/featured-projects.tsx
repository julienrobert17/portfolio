'use client'

import type { Project } from '@prisma/client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

interface Props {
  projects: Project[]
  isActive: boolean
}

export default function FeaturedProjects({ projects, isActive }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const title = titleRef.current
    const container = cardsRef.current

    if (!isActive) {
      title?.classList.remove('is-visible')
      if (container) {
        Array.from(container.children).forEach((card) => {
          card.classList.remove('is-visible')
          ;(card as HTMLElement).style.transitionDelay = ''
        })
      }
      return
    }

    // Trigger reveals after the section starts fading in (300ms delay on container)
    const timer = setTimeout(() => {
      title?.classList.add('is-visible')
      if (container) {
        Array.from(container.children).forEach((card, i) => {
          ;(card as HTMLElement).style.transitionDelay = `${i * 100}ms`
          card.classList.add('is-visible')
        })
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [isActive])

  return (
    <section
      style={{
        padding: '80px 24px 120px',
        maxWidth: 1140,
        margin: '0 auto',
      }}
    >
      <h2
        ref={titleRef}
        className="scroll-reveal"
        style={{
          fontSize: 'clamp(28px, 3vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: '#f0f7f2',
          marginBottom: 48,
        }}
      >
        Mes réalisations
      </h2>

      <div
        ref={cardsRef}
        style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}
      >
        {projects.map((project) => (
          <article
            key={project.id}
            className="card-reveal"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              borderRadius: 16,
              border: '1px solid rgba(74,222,128,0.1)',
              padding: '24px',
              backgroundColor: '#0d2318',
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: '#f0f7f2',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {project.title}
            </h3>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: 'rgba(240,247,242,0.55)',
                flex: 1,
                margin: 0,
              }}
            >
              {project.description}
            </p>

            {project.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 9999,
                      backgroundColor: 'rgba(74,222,128,0.09)',
                      color: '#4ade80',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/projects/${project.slug}`}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#4ade80',
                textDecoration: 'none',
                marginTop: 4,
              }}
            >
              Voir le projet →
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
