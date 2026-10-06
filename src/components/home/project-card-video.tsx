'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

interface Props {
  src: string
  poster?: string
}

/**
 * Vidéo de survol d'une carte projet. Tout est piloté depuis le DOM
 * (classe `is-playing`), sans state : au survol sur desktop, à 60 % de
 * visibilité sur tactile. Jamais jouée si prefers-reduced-motion.
 */
export default function ProjectCardVideo({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const loaded = useRef(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video || reducedMotion) return
    const card = video.closest<HTMLElement>('.project-card')
    if (!card) return

    const play = () => {
      if (!loaded.current) {
        video.load()
        loaded.current = true
      }
      video.play().catch(() => {})
      video.classList.add('is-playing')
    }
    const stop = () => {
      video.pause()
      video.currentTime = 0
      video.classList.remove('is-playing')
    }

    if (window.matchMedia('(hover: hover)').matches) {
      card.addEventListener('mouseenter', play)
      card.addEventListener('mouseleave', stop)
      return () => {
        card.removeEventListener('mouseenter', play)
        card.removeEventListener('mouseleave', stop)
        stop()
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) play(); else stop() },
      { threshold: 0.6 },
    )
    observer.observe(card)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <video
      ref={videoRef}
      className="project-card-video"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
      }}
    />
  )
}
