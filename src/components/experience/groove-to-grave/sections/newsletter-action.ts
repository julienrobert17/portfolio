'use server'

import { redirect } from 'next/navigation'
import { BASE } from '../lib/routes'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Valide l'adresse et n'enregistre rien : aucun fournisseur de newsletter n'est encore choisi
 * avec le label. Redirige vers la page d'origine avec l'état dans l'URL, ce qui fonctionne sans
 * JavaScript. Aucun secret, aucune écriture.
 */
export async function inscrireNewsletter(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim()
  const retour = String(formData.get('retour') ?? BASE)
  const page = retour.startsWith(BASE) ? retour : BASE
  redirect(`${page}?newsletter=${EMAIL.test(email) ? 'merci' : 'invalide'}#newsletter`)
}
