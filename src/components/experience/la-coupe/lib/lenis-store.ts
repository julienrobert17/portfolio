import type Lenis from 'lenis'

/**
 * Une seule instance Lenis pour toute l'expérience, partagée sans contexte
 * React : les transitions de page et le canvas (Phase 2) y accèdent aussi.
 * `null` quand le défilement natif est conservé (tactile, reduced motion).
 */
let instance: Lenis | null = null

export function setLenis(lenis: Lenis | null): void {
  instance = lenis
}

export function getLenis(): Lenis | null {
  return instance
}

/** Remet le défilement en haut, sans animation, Lenis ou pas. */
export function scrollEnHaut(): void {
  if (instance) {
    instance.scrollTo(0, { immediate: true, force: true })
  } else {
    window.scrollTo(0, 0)
  }
}

/** Recalcule les limites après un changement de contenu. */
export function recalculerScroll(): void {
  instance?.resize()
}
