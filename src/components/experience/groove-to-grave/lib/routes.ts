/** Chemins de l'expérience : toutes les URL internes passent par ici. */
export const BASE = '/experience/groove-to-grave'

export const routes = {
  accueil: BASE,
  sorties: `${BASE}/sorties`,
  sortie: (ref: string) => `${BASE}/sorties/${ref}`,
  artistes: `${BASE}/artistes`,
  artiste: (slug: string) => `${BASE}/artistes/${slug}`,
  soirees: `${BASE}/soirees`,
  /** Ancre d'une soirée dans la page soirées : la date est son identité (Phase 7.8). */
  soiree: (date: string) => `${BASE}/soirees#soiree-${date}`,
  label: `${BASE}/label`,
  contact: `${BASE}/contact`,
  sources: `${BASE}/sources`,
} as const

export const NAV: { href: string; label: string; icone: 'disque' | 'artistes' | 'soirees' | 'label' | 'contact' }[] = [
  { href: routes.sorties, label: 'sorties', icone: 'disque' },
  { href: routes.artistes, label: 'artistes', icone: 'artistes' },
  { href: routes.soirees, label: 'soirées', icone: 'soirees' },
  { href: routes.label, label: 'le label', icone: 'label' },
  { href: routes.contact, label: 'contact', icone: 'contact' },
]

export const URL_SITE = 'https://portfolio-eight-sable-66.vercel.app'
