import type { CSSProperties } from 'react'

/** Vert vif du site, valeur par défaut de `--accent` (voir @property dans globals.css). */
export const DEFAULT_ACCENT = '#4ade80'

// Choix de design, pas du contenu : l'accent vit ici, pas en base.
const ACCENTS: Record<string, string> = {
  'un-moment-hors-du-temps': '#FB923C',
  prototaxites: '#C084FC',
  geodatle: '#38BDF8',
  'portfolio-ia': '#F472B6',
  'task-manager-app': '#FACC15',
  'la-coupe': '#F87171',
}

export function getAccent(slug: string): string {
  return ACCENTS[slug] ?? DEFAULT_ACCENT
}

/** Style inline posant `--accent` sur un wrapper de page projet. */
export function accentStyle(slug: string): CSSProperties {
  return { '--accent': getAccent(slug) } as CSSProperties
}
