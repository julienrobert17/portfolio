'use client'

import type { registerGsap } from './gsap'

type Gsap = ReturnType<typeof registerGsap>['gsap']

/** Ordre de tracé : traits forts, moyens, fins, puis les annotations tardives. */
const ORDRE: Array<{ selecteur: string; part: number }> = [
  { selecteur: 'path[data-epaisseur="fort"]:not([data-tardif])', part: 0.34 },
  { selecteur: 'path[data-epaisseur="moyen"]:not([data-tardif])', part: 0.28 },
  { selecteur: 'path[data-epaisseur="fin"]:not([data-tardif])', part: 0.22 },
  { selecteur: 'path[data-tardif]', part: 0.16 },
]

/**
 * Trace un dessin au trait (DrawSVG) en 1,6 s à l'entrée dans le viewport,
 * puis fait apparaître les cotes (paths `data-cote` et libellés HTML
 * `[data-cote-label]` du même conteneur). Retourne la timeline.
 * Les états initiaux sont posés ici : sans JavaScript, le dessin est complet.
 */
export function tracerDessin(gsap: Gsap, svg: SVGSVGElement, options: { trigger?: Element; duree?: number; conteneur?: Element } = {}) {
  const duree = options.duree ?? 1.6
  const conteneur = options.conteneur ?? svg.parentElement ?? svg
  const labels = conteneur.querySelectorAll('[data-cote-label]')
  const cotes = svg.querySelectorAll('[data-cote] path')
  const tl = gsap.timeline({
    scrollTrigger: { trigger: options.trigger ?? svg, start: 'top 85%', once: true },
  })
  let position = 0
  for (const { selecteur, part } of ORDRE) {
    const paths = svg.querySelectorAll(selecteur)
    if (paths.length === 0) continue
    tl.from(paths, { drawSVG: 0, duration: duree * part, ease: 'power1.inOut' }, position)
    position += duree * part
  }
  if (cotes.length) tl.from(cotes, { drawSVG: 0, duration: 0.4, ease: 'power1.out' }, position)
  if (labels.length) tl.from(labels, { opacity: 0, duration: 0.4, ease: 'power1.out' }, position + 0.15)
  return tl
}
