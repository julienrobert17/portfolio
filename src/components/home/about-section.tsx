import type { CSSProperties } from 'react'
import Footer from '@/components/layout/footer'

const STACK: { label: string; items: string[] }[] = [
  { label: 'Front', items: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Three.js / R3F'] },
  { label: 'Back', items: ['Node.js', 'Prisma', 'PostgreSQL'] },
  { label: 'Outils', items: ['Git', 'Vercel', 'Figma'] },
]

const PRINCIPLES = [
  'Je prototype avant de spécifier.',
  'Je préfère un truc qui marche mal à un plan parfait.',
  'Je mesure avant d’optimiser.',
]

// Même rendu que les pills de tags des cartes projets
const pillStyle: CSSProperties = {
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
}

const subtitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: '#d0f0d2',
}

export default function AboutSection() {
  return (
    <section
      id="a-propos"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 56,
      }}
    >
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 1140,
        margin: '0 auto',
        padding: '40px 24px',
      }}>
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-3 md:gap-14">
          <div className="md:col-span-2">
            <h2 style={{
              fontSize: 'clamp(28px, 3vw, 40px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#f0f7f2',
              margin: '0 0 28px',
            }}>
              À propos
            </h2>

            <p style={{
              margin: '0 0 36px',
              maxWidth: '60ch',
              fontSize: 'clamp(16px, 1.2vw, 18px)',
              lineHeight: 1.65,
              color: 'rgba(240,247,242,0.75)',
            }}>
              [Qui je suis, en 4 lignes, avec un détail concret et pas professionnel.]
            </p>

            <h3 style={subtitleStyle}>Comment je travaille</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 15,
              lineHeight: 1.6,
              color: 'rgba(240,247,242,0.75)',
            }}>
              {PRINCIPLES.map((line) => (
                <li key={line}>— {line}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={subtitleStyle}>Stack</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {STACK.map((group) => (
                <div key={group.label}>
                  <p style={{
                    margin: '0 0 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(240,247,242,0.5)',
                  }}>
                    {group.label}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {group.items.map((item) => (
                      <span key={item} style={pillStyle}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer compact />
    </section>
  )
}
