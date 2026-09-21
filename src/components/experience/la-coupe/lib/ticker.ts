import gsap from 'gsap'

type Tick = (temps: number, delta: number) => void

const abonnes = new Set<Tick>()
let installe = false

function boucle(temps: number, delta: number) {
  for (const fn of abonnes) fn(temps, delta)
}

/**
 * La seule boucle d'animation de l'expérience : le ticker GSAP. Lenis y
 * avance son défilement, le canvas R3F y rend sa frame (frameloop="never").
 * `temps` est en secondes, `delta` en millisecondes (convention GSAP).
 */
export function onTick(fn: Tick): () => void {
  abonnes.add(fn)
  if (!installe) {
    installe = true
    gsap.ticker.lagSmoothing(0)
    gsap.ticker.add(boucle)
  }
  return () => {
    abonnes.delete(fn)
  }
}
