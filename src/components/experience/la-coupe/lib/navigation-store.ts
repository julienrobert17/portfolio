/**
 * État de navigation partagé entre PageTransition, les liens, le menu, le
 * projet suivant et le canvas. Hors React : lu et écrit dans des effets.
 */
/**
 * - `rideau` : rideau maison. - `partage` : l'image s'étire vers le hero de la fiche.
 * - `continu` : fin de course du projet suivant, déjà à la géométrie du hero cible :
 *   rien ne bouge, seule la légende change en fondu croisé.
 * - `menu` : le menu ouvert est lui-même le rideau ; il se lève sur la nouvelle page.
 */
export type TypeTransition = 'rideau' | 'partage' | 'continu' | 'menu'

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
  /** La fiche arrive en continu depuis le projet suivant : son hero est déjà en place, aucune entrée. */
  arriveeContinue: false,
  /** Après une arrivée en continu, la nav reste cachée jusqu'au premier défilement vers le haut. */
  navTenue: false,
  /** Le menu couvre tout l'écran : résolue à la fin de son ouverture (null tant qu'il est fermé). */
  couvertureMenu: null as Promise<void> | null,
  /** La prochaine fermeture du menu est une levée de rideau après navigation (600 ms). */
  leveeMenu: false,
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

// ─── Élément partagé ───
const ecouteursPartage = new Set<Ecouteur>()
let ciblePartage: string | null = null

export function abonnerPartage(fn: Ecouteur): () => void {
  ecouteursPartage.add(fn)
  return () => {
    ecouteursPartage.delete(fn)
  }
}
/** Slug du projet vers lequel une transition `partage` est en cours, sinon null. */
export const lireCiblePartage = (): string | null => ciblePartage
export const lireCiblePartageServeur = (): string | null => null
export function setCiblePartage(slug: string | null): void {
  if (ciblePartage === slug) return
  ciblePartage = slug
  for (const fn of ecouteursPartage) fn()
}
