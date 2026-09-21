/** Transitions d'interface. */
export const EASE_UI = 'cubic-bezier(0.76, 0, 0.24, 1)'
/** La même courbe pour GSAP, qui ne lit pas `cubic-bezier()` (il retomberait sur son ease par défaut) : quart in-out. */
export const EASE_UI_GSAP = 'power3.inOut'
/** Entrées (équivalent expo.out). */
export const EASE_ENTER = 'cubic-bezier(0.16, 1, 0.3, 1)'

export const DUREE = {
  micro: 250,
  entree: 800,
  page: 1000,
} as const
