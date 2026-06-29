'use client'

import type { Project } from '@prisma/client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

interface Props {
  projects: Project[]
  isActive: boolean
}

export default function FeaturedProjects({ projects, isActive }: Props) {
  const titleRef  = useRef<HTMLHeadingElement>(null)
  const cardsRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const title     = titleRef.current
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

    // Titre d'abord, puis cards en cascade avec 180ms de head start
    const timer = setTimeout(() => {
      title?.classList.add('is-visible')
      if (container) {
        Array.from(container.children).forEach((card, i) => {
          ;(card as HTMLElement).style.transitionDelay = `${180 + i * 140}ms`
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
        {projects.map((project, i) => (
          <article
            key={project.id}
            className="project-card card-reveal"
          >
            {/* Image de fond */}
            {project.slug === 'prototaxites' ? (
              // Placeholder visuel spécifique à l'expérience Prototaxites (pas d'image)
              <div
                className="project-card-bg"
                style={{ backgroundColor: '#020a06', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  color: 'rgba(74,222,128,0.55)',
                  animation: 'proto-pulse 3s ease-in-out infinite',
                }}>
                  420 Ma
                </span>
              </div>
            ) : (
              <div
                className="project-card-bg"
                style={{
                  backgroundColor: '#1a3d2b',
                  backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : undefined,
                }}
              />
            )}

            {/* Dégradé sombre vers le bas */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.12) 100%)',
              zIndex: 1,
            }} />

            {/* Numéro */}
            <span style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 2,
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Contenu bas */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0 24px 24px',
              zIndex: 2,
            }}>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 9999,
                      backgroundColor: 'rgba(74,222,128,0.15)',
                      color: '#4ade80',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Titre */}
              <h3 style={{
                fontWeight: 700,
                fontSize: 'clamp(17px, 1.8vw, 21px)',
                color: '#f0f7f2',
                margin: 0,
                lineHeight: 1.25,
              }}>
                {project.title}
              </h3>

              {/* Reveal au hover : description + lien */}
              <div className="project-card-reveal">
                <div>
                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: 'rgba(240,247,242,0.65)',
                    margin: '0 0 14px',
                  }}>
                    {project.description}
                  </p>
                  <Link
                    href={project.liveUrl ?? `/projects/${project.slug}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#4ade80',
                      textDecoration: 'none',
                    }}
                  >
                    Voir le projet →
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
