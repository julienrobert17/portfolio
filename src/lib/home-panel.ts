/**
 * Panneau courant de la home, sans toucher à l'URL : mémorisé par onglet
 * (sessionStorage) pour survivre à un rechargement, et demandé par un
 * événement depuis le header quand on est déjà sur la home.
 */
export type HomePanel = 'hero' | 'projects' | 'about'

export const HOME_PANEL_KEY = 'home-panel'
export const HOME_PANEL_EVENT = 'home:panel'

export function isHomePanel(value: unknown): value is HomePanel {
  return value === 'hero' || value === 'projects' || value === 'about'
}

export function readHomePanel(): HomePanel | null {
  try {
    const stored = sessionStorage.getItem(HOME_PANEL_KEY)
    return isHomePanel(stored) ? stored : null
  } catch {
    return null
  }
}

export function storeHomePanel(panel: HomePanel): void {
  try {
    sessionStorage.setItem(HOME_PANEL_KEY, panel)
  } catch {
    // stockage indisponible : la home repartira du hero
  }
}

/** Filtre du panneau réalisations, mémorisé par onglet sous sa propre clé. */
export type ProjectFilter = 'perso' | 'entreprise'

export const HOME_FILTER_KEY = 'home-filter'

export function readHomeFilter(): ProjectFilter | null {
  try {
    const stored = sessionStorage.getItem(HOME_FILTER_KEY)
    return stored === 'perso' || stored === 'entreprise' ? stored : null
  } catch {
    return null
  }
}

export function storeHomeFilter(filter: ProjectFilter): void {
  try {
    sessionStorage.setItem(HOME_FILTER_KEY, filter)
  } catch {
    // stockage indisponible : le filtre repartira sur « Personnels »
  }
}

/** Demande un panneau : mémorisé pour le montage de la home, et signalé si elle est déjà affichée. */
export function requestHomePanel(panel: HomePanel): void {
  storeHomePanel(panel)
  window.dispatchEvent(new CustomEvent<HomePanel>(HOME_PANEL_EVENT, { detail: panel }))
}
