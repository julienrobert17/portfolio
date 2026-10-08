'use client'

import type { CSSProperties } from 'react'
import type { Project } from '@prisma/client'
import { getAccent } from '@/lib/accents'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import ProjectCardVideo from '@/components/home/project-card-video'

interface Props {
  projects: Project[]
  isActive: boolean
  /** Slugs ayant une étude de cas (content/case-studies). */
  caseStudies?: string[]
}

export default function FeaturedProjects({ projects, isActive, caseStudies = [] }: Props) {
  const titleRef  = useRef<HTMLHeadingElement>(null)
  const cardsRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const title     = titleRef.current
    const container = cardsRef.current

    const cards = container ? Array.from(container.querySelectorAll<HTMLElement>('.project-card')) : []
    const titles = [title, ...(container ? Array.from(container.querySelectorAll<HTMLElement>('.group-title')) : [])]

    if (!isActive) {
      titles.forEach((t) => t?.classList.remove('is-visible'))
      cards.forEach((card) => {
        card.classList.remove('is-visible')
        card.style.transitionDelay = ''
      })
      return
    }

    // Titres d'abord, puis cards en cascade avec 180ms de head start
    const timer = setTimeout(() => {
      titles.forEach((t) => t?.classList.add('is-visible'))
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${180 + i * 140}ms`
        card.classList.add('is-visible')
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [isActive])

  // Deux groupes, même tuile : numérotation continue d'un groupe à l'autre
  const groups = [
    { key: 'perso', title: 'Projets personnels', items: projects.filter((p) => p.category !== 'entreprise') },
    { key: 'entreprise', title: 'Réalisations en entreprise', items: projects.filter((p) => p.category === 'entreprise') },
  ].filter((group) => group.items.length > 0)
  let offset = 0

  return (
    <section
      id="realisations"
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

      <div ref={cardsRef}>
        {groups.map((group) => {
          const start = offset
          offset += group.items.length
          return (
        <div key={group.key} style={{ marginBottom: 56 }}>
          <h3
            className="scroll-reveal group-title"
            style={{
              margin: '0 0 20px',
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--accent-dim)',
            }}
          >
            {group.title}
          </h3>
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
        {group.items.map((project, j) => {
          const i = start + j
          const hasVisual = Boolean(project.imageUrl || project.videoUrl)
          return (
          <article
            key={project.id}
            className="project-card card-reveal"
            style={{ '--card-accent': getAccent(project.slug) } as CSSProperties}
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
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  color: 'var(--accent)',
                  textShadow: '0 0 12px color-mix(in oklch, var(--accent) 60%, transparent), 0 0 28px color-mix(in oklch, var(--accent) 35%, transparent)',
                  animation: 'proto-pulse 3s ease-in-out infinite',
                }}>
                  420 Ma
                </span>
              </div>
            ) : project.slug === 'entre-nous' ? (
              /*
               * L'expérience en miniature : ses deux territoires et la ligne
               * de laiton entre les deux. Pas d'image — c'est exactement tout
               * ce qu'il y a à montrer, et ça évite un asset pour trois divs.
               */
              <div
                className="project-card-bg"
                style={{ backgroundColor: '#14120F', display: 'flex' }}
              >
                <div style={{ flex: 1, backgroundColor: '#1C1A16' }} />
                <div style={{ flex: '0 0 2px', backgroundColor: '#C8A45C', opacity: 0.85 }} />
                <div style={{ flex: 1, backgroundColor: '#191712' }} />
              </div>
            ) : project.slug === 'un-moment-hors-du-temps' ? (
              /*
               * Photo de Mimi. La source est un portrait 2160x3840 où le chat
               * est en diagonale : tête à ~78% en largeur / ~41% en hauteur,
               * pieds et parquet en bas. Un `cover` centré cadrerait la queue
               * et le carrelage. On zoome donc à 160% et on colle à droite pour
               * garder la tête au centre de la carte, au-dessus du dégradé, et
               * sortir les pieds du cadre.
               */
              <div
                className="project-card-bg"
                style={{
                  backgroundColor: '#2e2a26',
                  backgroundImage: 'url(/experience/mimi/chat-carte.jpg)',
                  backgroundSize: '160% auto',
                  backgroundPosition: '100% 39%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ) : hasVisual ? (
              <div
                className="project-card-bg"
                style={{
                  backgroundColor: '#1a3d2b',
                  backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : undefined,
                }}
              />
            ) : (
              /*
               * Pas d'image ni de vidéo : fond typographique assumé, le titre
               * répété en diagonale, très grand et quasi transparent.
               */
              <div
                className="project-card-bg"
                style={{ backgroundColor: '#1a3d2b', overflow: 'hidden' }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'rotate(-18deg) translate(-12%, -18%)',
                    transformOrigin: 'top left',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: 'clamp(56px, 7vw, 84px)',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    color: '#d0f0d2',
                    opacity: 0.06,
                    pointerEvents: 'none',
                  }}
                >
                  {Array.from({ length: 6 }, (_, line) => (
                    <div key={line} style={{ marginLeft: line * 48 }}>{project.title}</div>
                  ))}
                </div>
              </div>
            )}

            {project.videoUrl && (
              <ProjectCardVideo src={project.videoUrl} poster={project.imageUrl ?? undefined} />
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
              fontSize: hasVisual ? 11 : 13,
              fontWeight: 700,
              color: 'var(--accent-dim)',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
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
                      backgroundColor: 'rgba(4,18,11,0.65)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      border: '1px solid color-mix(in oklch, var(--accent) 25%, transparent)',
                      color: 'var(--accent)',
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
                    // Sans démo en ligne, la tuile mène à la fiche projet
                    href={project.liveUrl || `/projects/${project.slug}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--accent)',
                      textDecoration: 'none',
                    }}
                  >
                    Voir le projet →
                  </Link>
                  {caseStudies.includes(project.slug) && (
                    <Link
                      href={`/projects/${project.slug}`}
                      style={{
                        marginLeft: 16,
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--accent-dim)',
                        textDecoration: 'none',
                      }}
                    >
                      Lire l&apos;étude de cas →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
          )
        })}
          </div>
        </div>
          )
        })}
      </div>
    </section>
  )
}
