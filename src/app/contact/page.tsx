import ContactForm from '@/components/contact/contact-form'

const EASE = 'cubic-bezier(0.16,1,0.3,1)'

export default function ContactPage() {
  return (
    <main style={{
      backgroundColor: '#0d271e',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(48px, 6vw, 100px)',
    }}>

      {/* Gauche — titre */}
      <div>
        <h1 style={{ margin: 0, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.03em' }}>
          <span style={{
            display: 'block',
            fontSize: 'clamp(56px, 7vw, 96px)',
            color: '#d0f0d2',
            animation: `slideUp 700ms ${EASE} 150ms both`,
          }}>
            Let&apos;s
          </span>
          <span style={{
            display: 'block',
            fontSize: 'clamp(56px, 7vw, 96px)',
            color: '#4ade80',
            animation: `slideUp 700ms ${EASE} 300ms both`,
          }}>
            talk.
          </span>
        </h1>
        <p style={{
          marginTop: '24px',
          color: 'rgba(208,240,210,0.5)',
          fontSize: 'clamp(14px, 1.2vw, 16px)',
          animation: `slideUp 700ms ${EASE} 450ms both`,
        }}>
          Je suis disponible pour des missions freelance et opportunités.
        </p>
      </div>

      {/* Droite — formulaire */}
      <ContactForm />

    </main>
  )
}
