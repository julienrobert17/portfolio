import { hero } from './hero-store'

/**
 * Ce que le menu dit au rig du projet survolé. Le menu n'écrit que des faits
 * bruts (quelle ligne, quand le pointeur a bougé pour la dernière fois) ; la
 * décision — 120 ms d'immobilité, retour au modèle par défaut après 300 ms —
 * se prend dans le rig, à chaque frame, hors React.
 */
export const survolMenu = {
  /** Slug de la ligne sous le pointeur ou au focus, sinon null. */
  slug: null as string | null,
  /** Dernier mouvement du pointeur sur une ligne, en ms (performance.now). */
  dernierMouvement: 0,
  /** Focus clavier : la ligne devient cible sans attendre. */
  immediat: false,
  /** Instant où le pointeur a quitté la liste. */
  sortie: 0,
}

export function signalerSurvol(slug: string, immediat = false): void {
  survolMenu.slug = slug
  survolMenu.immediat = immediat
  survolMenu.dernierMouvement = performance.now()
  hero.sale = true
}

export function signalerSortie(): void {
  if (survolMenu.slug === null) return
  survolMenu.slug = null
  survolMenu.immediat = false
  survolMenu.sortie = performance.now()
  hero.sale = true
}
