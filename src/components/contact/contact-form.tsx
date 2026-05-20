'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

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
      <p className="text-sm font-medium text-[#534AB7]">
        Message envoyé ! Je vous réponds sous 48h.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {status === 'error' && (
        <p className="text-sm text-red-500">Une erreur est survenue, réessayez.</p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">Nom</label>
        <input
          id="name" name="name" type="text" autoComplete="name"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7]/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email" name="email" type="email" autoComplete="email"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7]/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <textarea
          id="message" name="message" rows={5}
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#534AB7]/40 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="self-start rounded-full bg-[#1a1a1a] text-white dark:bg-white dark:text-[#1a1a1a] px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-50"
      >
        {status === 'loading' ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  )
}
