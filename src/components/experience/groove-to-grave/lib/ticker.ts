type Tick = (temps: number, delta: number) => void

const abonnes = new Set<Tick>()
let image = 0
let precedent = 0

function boucle(maintenant: number): void {
  const delta = precedent ? maintenant - precedent : 16.7
  precedent = maintenant
  for (const fn of abonnes) fn(maintenant / 1000, delta)
  image = abonnes.size ? window.requestAnimationFrame(boucle) : 0
  if (!abonnes.size) precedent = 0
}

/**
 * La seule boucle d'animation de l'expérience, en requestAnimationFrame natif : Lenis y avance
 * son défilement, le mur et le spectre y rendent leur image, le pleurage y suit la lecture.
 * Elle ne tourne que s'il y a des abonnés. `temps` est en secondes, `delta` en millisecondes
 * (convention GSAP, gardée de la copie de la-coupe ; GSAP lui-même n'est plus chargé au départ,
 * voir lib/gsap.ts).
 */
export function onTick(fn: Tick): () => void {
  abonnes.add(fn)
  if (!image) image = window.requestAnimationFrame(boucle)
  return () => {
    abonnes.delete(fn)
  }
}
