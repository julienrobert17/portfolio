/**
 * État de navigation partagé entre PageTransition, les liens, le menu, le
 * projet suivant et le canvas. Hors React : lu et écrit dans des effets.
 */
export type TypeTransition = 'rideau' | 'partage'

export interface DemandeNavigation {
  href: string
  type: TypeTransition
  /** Nom de la page de destination, affiché sur le rideau. */
  label: string
}

type Navigateur = (demande: DemandeNavigation) => void
let navigateur: Navigateur | null = null

export function setNavigateur(fn: Navigateur | null): void {
  navigateur = fn
}

/** Navigue avec transition ; sans PageTransition monté, navigation classique. */
export function naviguer(demande: DemandeNavigation): void {
  if (navigateur) navigateur(demande)
  else window.location.assign(demande.href)
}

export const navigation = {
  /** La fiche qui se monte arrive par élément partagé : pas de révélation clip-path. */
  arriveePartagee: false,
  /** Une navigation avec transition est en cours (rideau ou partage). */
  enCours: null as DemandeNavigation | null,
}

// ─── Menu ───
type Ecouteur = () => void
const ecouteurs = new Set<Ecouteur>()
let menuOuvert = false

export function abonnerMenu(fn: Ecouteur): () => void {
  ecouteurs.add(fn)
  return () => {
    ecouteurs.delete(fn)
  }
}
export const lireMenu = (): boolean => menuOuvert
export const lireMenuServeur = (): boolean => false
export function setMenuOuvert(ouvert: boolean): void {
  if (menuOuvert === ouvert) return
  menuOuvert = ouvert
  for (const fn of ecouteurs) fn()
}
