'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

const EASE = 'cubic-bezier(0.16,1,0.3,1)'

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  color: '#d0f0d2',
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '8px',
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim(),
    }

    if (!data.name || !data.email || !data.message) {
      setError('Tous les champs sont requis.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError('Adresse email invalide.')
      return
    }

    setError('')
    setStatus('loading')

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    setStatus(res.ok ? 'success' : 'error')
  }

  if (status === 'success') {
    return (
      <div style={{
        width: 'clamp(340px, 40vw, 520px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(208,240,210,0.1)',
        borderRadius: '16px',
        padding: '40px',
        animation: `slideUp 700ms ${EASE} 0ms both`,
      }}>
        <p style={{ color: '#4ade80', fontSize: '16px', fontWeight: 500 }}>
          Message envoyé ! Je vous réponds sous 48h.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        width: 'clamp(340px, 40vw, 520px)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(208,240,210,0.1)',
        borderRadius: '16px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: `slideUp 700ms ${EASE} 500ms both`,
      }}
    >
      {error && (
        <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
      )}
      {status === 'error' && (
        <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>
          Une erreur est survenue, réessayez.
        </p>
      )}

      <div>
        <label htmlFor="name" style={LABEL_STYLE}>Nom</label>
        <input
          id="name" name="name" type="text" autoComplete="name"
          placeholder="Votre nom"
          className="contact-input"
        />
      </div>

      <div>
        <label htmlFor="email" style={LABEL_STYLE}>Email</label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          placeholder="votre@email.com"
          className="contact-input"
        />
      </div>

      <div>
        <label htmlFor="message" style={LABEL_STYLE}>Message</label>
        <textarea
          id="message" name="message" rows={4}
          placeholder="Votre message…"
          className="contact-input"
          style={{ resize: 'none' }}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="hero-btn"
        style={{ opacity: status === 'loading' ? 0.5 : 1, alignSelf: 'flex-start' }}
      >
        {status === 'loading' ? 'Envoi…' : 'Envoyer →'}
      </button>
    </form>
  )
}
