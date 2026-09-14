const CLE = 'entre-nous-graine'

/**
 * La graine du tirage. Elle vit à part de l'état de la partie : le déroulé
 * doit être construit AVANT la machine, et un refresh ne doit jamais rebattre
 * les cartes.
 */
export function lireOuCreerGraine(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    const existante = sessionStorage.getItem(CLE)
    if (existante) return existante
    const neuve = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
    sessionStorage.setItem(CLE, neuve)
    return neuve
  } catch {
    // Navigation privée : la graine ne survit pas au refresh, l'expérience si.
    return 'sans-stockage'
  }
}

export function oublierGraine(): void {
  try {
    sessionStorage.removeItem(CLE)
  } catch {
    // sans effet
  }
}
