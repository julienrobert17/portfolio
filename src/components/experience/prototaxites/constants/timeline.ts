export interface GeologicalDate {
  value: number        // en millions d'années (négatif = passé)
  label: Record<'en' | 'fr', string>
}

export const GEOLOGICAL_DATES: GeologicalDate[] = [
  { value: -420, label: { en: '420 million years ago', fr: 'Il y a 420 millions d\'années' } },
  { value: -375, label: { en: '375 million years ago', fr: 'Il y a 375 millions d\'années' } },
  { value: -360, label: { en: '360 million years ago', fr: 'Il y a 360 millions d\'années' } },
  { value: -0.4, label: { en: '400,000 years ago', fr: 'Il y a 400 000 ans' } },
]

// Durée en ms d'une accélération keybind (facteur x3)
export const FAST_FORWARD_FACTOR = 3

// Keybinds — ne pas modifier ces valeurs
export const KEYBINDS = {
  NEXT:         ' ',       // Espace
  PREV:         'Shift+ ', // Shift+Espace — géré manuellement avec e.shiftKey
  FAST_FORWARD: 'f',
  PAUSE:        'Escape',
} as const
