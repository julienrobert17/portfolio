/**
 * Signal d'avance rapide partagé entre la transition de page (layout/transition-page.tsx) et le
 * mur (canvas/mur.tsx) : un horodatage de départ, une progression de 0 à 1 sur 400 ms, et la
 * possibilité de figer la progression pour les captures (window.__g2g.figerTransition).
 */
export const DUREE_AVANCE_MS = 400

let debut = 0
let figee: number | null = null
const ecouteurs = new Set<() => void>()

/** Démarre une avance rapide visuelle maintenant ; les abonnés (le mur) relancent leur rendu. */
export function declencherAvance(): void {
  debut = performance.now()
  for (const fn of ecouteurs) fn()
}

export function surAvance(fn: () => void): () => void {
  ecouteurs.add(fn)
  return () => {
    ecouteurs.delete(fn)
  }
}

/** Progression de l'avance rapide en cours, 0 hors transition ; figée si demandé. */
export function progressionAvance(maintenant = performance.now()): number {
  if (figee !== null) return figee
  if (!debut) return 0
  const p = (maintenant - debut) / DUREE_AVANCE_MS
  return p >= 1 ? 0 : p
}

/** Fige la progression (captures) ou la libère avec null. */
export function figerAvance(p: number | null): void {
  figee = p
  for (const fn of ecouteurs) fn()
}

export function avanceFigee(): boolean {
  return figee !== null
}
