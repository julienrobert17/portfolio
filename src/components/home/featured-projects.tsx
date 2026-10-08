'use client'

import type { CSSProperties } from 'react'
import type { Project } from '@prisma/client'
import { getAccent } from '@/lib/accents'
import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import ProjectCardVideo from '@/components/home/project-card-video'
import { readHomeFilter, storeHomeFilter, type ProjectFilter } from '@/lib/home-panel'

interface Props {
  projects: Project[]
  isActive: boolean
  /** Slugs ayant une étude de cas (content/case-studies). */
  caseStudies?: string[]
  /** La hauteur de la grille a changé (filtre) : le parent remonte le conteneur et repose sa garde. */
  onLayoutChange?: () => void
}

const FILTERS: { value: ProjectFilter; label: string }[] = [
  { value: 'perso', label: 'Personnels' },
  { value: 'entreprise', label: 'En entreprise' },
]

const subscribeNoop = () => () => {}

const pillBase: CSSProperties = {
  padding: '4px 12px',
  borderRadius: 9999,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
}

export default function FeaturedProjects({ projects, isActive, caseStudies = [], onLayoutChange }: Props) {
  const titleRef  = useRef<HTMLHeadingElement>(null)
  const cardsRef  = useRef<HTMLDivElement>(null)
  const filterRefs = useRef<(HTMLButtonElement | null)[]>([])
  const switching = useRef(false)
  // Au changement de filtre, la cascade repart presque tout de suite (pas le délai d'entrée du panneau)
  const quickCascade = useRef(false)

  // Filtre mémorisé par l'onglet, appliqué une fois au premier rendu client
  const [filter, setFilter] = useState<ProjectFilter>('perso')
  const storedFilter = useSyncExternalStore(subscribeNoop, readHomeFilter, () => undefined)
  const [storedApplied, setStoredApplied] = useState(false)
  if (storedFilter !== undefined && !storedApplied) {
    setStoredApplied(true)
    if (storedFilter) setFilter(storedFilter)
  }

  const visible = projects.filter((p) => (p.category === 'entreprise') === (filter === 'entreprise'))

  useEffect(() => {
    const title     = titleRef.current
    const container = cardsRef.current
    const cards = container ? Array.from(container.querySelectorAll<HTMLElement>('.project-card')) : []
    const titles = [title, ...(container ? Array.from(container.querySelectorAll<HTMLElement>('.panel-reveal')) : [])]

    if (!isActive) {
      titles.forEach((t) => t?.classList.remove('is-visible'))
      cards.forEach((card) => {
        card.classList.remove('is-visible')
        card.style.transitionDelay = ''
      })
      return
    }

    // Titres d'abord, puis cards en cascade avec 180ms de head start
    const delay = quickCascade.current ? 50 : 350
    quickCascade.current = false
    const timer = setTimeout(() => {
      titles.forEach((t) => t?.classList.add('is-visible'))
      cards.forEach((card, i) => {
        card.style.transitionDelay = `${180 + i * 140}ms`
        card.classList.add('is-visible')
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [isActive, filter])

  // Nouvelle hauteur de grille : le parent remonte le conteneur et repose sa garde de butée
  useEffect(() => {
    onLayoutChange?.()
  }, [filter, onLayoutChange])

  function changeFilter(next: ProjectFilter) {
    if (next === filter || switching.current) return
    switching.current = true
    storeHomeFilter(next)
    // Les cartes visibles sortent en fondu, puis le filtre bascule et la cascade reprend
    cardsRef.current?.querySelectorAll('.project-card').forEach((card) => card.classList.add('is-leaving'))
    setTimeout(() => {
      quickCascade.current = true
      setFilter(next)
      switching.current = false
    }, 150)
  }

  function onFilterKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const current = FILTERS.findIndex((f) => f.value === filter)
    const nextIndex = (current + (e.key === 'ArrowRight' ? 1 : -1) + FILTERS.length) % FILTERS.length
    filterRefs.current[nextIndex]?.focus()
    changeFilter(FILTERS[nextIndex].value)
  }

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
          marginBottom: 8,
        }}
      >
        Mes réalisations
      </h2>

      <div ref={cardsRef}>
        <p
          className="scroll-reveal panel-reveal"
          style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 12,
            letterSpacing: '0.06em',
            color: 'var(--accent-dim)',
          }}
        >
          Une sélection, pas un inventaire.
        </p>

        <div
          role="group"
          aria-label="Filtrer les réalisations"
          className="scroll-reveal panel-reveal"
          onKeyDown={onFilterKeyDown}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}
        >
          {FILTERS.map((f, index) => {
            const active = f.value === filter
            return (
              <button
                key={f.value}
                ref={(el) => { filterRefs.current[index] = el }}
                type="button"
                aria-pressed={active}
                onClick={() => changeFilter(f.value)}
                style={{
                  ...pillBase,
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#0d271e' : 'var(--accent)',
                  border: active ? '1px solid transparent' : '1px solid color-mix(in oklch, var(--accent) 25%, transparent)',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: 13,
              letterSpacing: '0.06em',
              color: 'var(--accent-dim)',
            }}
          >
            Bientôt.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
        {visible.map((project, i) => {
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
        )}
      </div>
    </section>
  )
}
