import Image from 'next/image'
import RotatingStrokes from '@/components/home/rotating-strokes'

const EASE_IN  = 'cubic-bezier(0.4, 0, 1, 1)'
const EASE_OUT = 'cubic-bezier(0.16,1,0.3,1)'

interface Props {
  onStart: () => void
  isLeaving: boolean
}

export default function HeroSection({ onStart, isLeaving }: Props) {
  function slideOut(delayMs: number): string {
    return `slideOutLeft 800ms cubic-bezier(0.76, 0, 0.24, 1) ${delayMs}ms both`
  }
  function slideIn(delayMs: number): string {
    return `slideUp 700ms ${EASE_OUT} ${delayMs}ms both`
  }

  return (
    <section style={{
      position: 'relative',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0d271e',
    }}>

      {/*
        Séparation en 2 divs pour éviter le conflit transform :
        - outer : porte l'animation (translateX) + le positionnement
        - inner : porte le translate(-50%, -50%) de centrage
      */}
      <div style={{
        position: 'absolute',
        top: '50vh',
        left: '60%',
        animation: `slideInRight 900ms ${EASE_OUT} 0ms both`,
      }}>
        <div style={{
          transform: 'translate(-50%, -50%)',
          width: 'clamp(420px, 48vw, 680px)',
          height: 'clamp(420px, 48vw, 680px)',
          position: 'relative',
        }}>
          {/* Cercle photo */}
          <div style={{
            position: 'relative',
            borderRadius: '50%',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          }}>
            <Image
              src="/PCVF.png"
              alt="Julien Robert"
              fill
              sizes="(max-width: 768px) 70vw, 48vw"
              style={{ objectFit: 'cover', animation: 'slow-zoom 9s ease-in-out infinite' }}
              priority
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(13,39,30,0.4)',
            }} />
          </div>

          {/* Traits rotatifs */}
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            right: '-40px',
            zIndex: 3,
            pointerEvents: 'none',
          }}>
            <RotatingStrokes isLeaving={isLeaving} />
          </div>
        </div>
      </div>

      {/* Texte — passe par-dessus l'image */}
      <div style={{
        position: 'absolute',
        top: '50vh',
        transform: 'translateY(-50%)',
        left: 'clamp(120px, 18vw, 280px)',
        zIndex: 2,
      }}>
        <h1 style={{
          margin: 0,
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
        }}>
          <span style={{
            display: 'block',
            fontSize: 'clamp(48px, 6vw, 80px)',
            color: '#d0f0d2',
            animation: isLeaving ? slideOut(0) : slideIn(150),
          }}>
            Julien
          </span>
          <span style={{
            display: 'block',
            fontSize: 'clamp(48px, 6vw, 80px)',
            color: '#d0f0d2',
            animation: isLeaving ? slideOut(0) : slideIn(250),
          }}>
            Robert
          </span>
          <span style={{
            display: 'block',
            fontSize: 'clamp(28px, 3.8vw, 52px)',
            color: '#4ade80',
            marginTop: '8px',
            animation: isLeaving ? slideOut(120) : slideIn(380),
          }}>
            Développeur
          </span>
          <span style={{
            display: 'block',
            fontSize: 'clamp(28px, 3.8vw, 52px)',
            color: '#4ade80',
            animation: isLeaving ? slideOut(240) : slideIn(460),
          }}>
            Full Stack
          </span>
        </h1>

        <div style={{
          marginTop: '40px',
          animation: isLeaving ? slideOut(360) : slideIn(600),
        }}>
          <button onClick={onStart} className="hero-btn-link" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(10px, 1vw, 14px)',
            paddingTop: 'clamp(6px, 0.5vw, 8px)',
            paddingBottom: 'clamp(6px, 0.5vw, 8px)',
            paddingLeft: 'clamp(18px, 1.8vw, 26px)',
            paddingRight: 'clamp(6px, 0.5vw, 8px)',
            borderRadius: '999px',
            backgroundColor: '#d0f0d2',
            color: '#0d271e',
            fontSize: 'clamp(12px, 1.1vw, 16px)',
            fontWeight: 600,
            fontFamily: 'var(--font-jakarta)',
            border: 'none',
            cursor: 'pointer',
          }}>
            Découvrir Mes Projets
            <span className="hero-arrow" style={{ backgroundColor: '#0d271e' }}>
              <span className="hero-arrow-tail" />
              <svg className="hero-arrow-head" width="6" height="12" viewBox="0 0 6 12" fill="none">
                <path d="M0.75 1L5.25 6L0.75 11" stroke="#d0f0d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>
        </div>
      </div>

    </section>
  )
}
