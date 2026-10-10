import gsap from 'gsap'
import { getLenis } from '../lib/lenis-store'

const DUREE = 0.45

/**
 * L'insertion : la cassette vole du mur jusqu'à la fenêtre cassette du skin (desktop) ou de la
 * barre du bas (mobile), en FLIP par GSAP, 450 ms. Positions mesurées après lenis.stop(). En
 * mouvement réduit, rien : la cassette apparaît directement dans la fenêtre. Décoratif : un
 * clone visuel, l'original reste en place.
 */
export function insererCassette(source: SVGSVGElement | null): void {
  if (!source || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cibles = Array.from(document.querySelectorAll<HTMLElement>('.g2g-fenetre')).filter((el) => el.offsetParent !== null && el.getClientRects().length)
  const cible = cibles[0]
  if (!cible) return
  const lenis = getLenis()
  lenis?.stop()
  const de = source.getBoundingClientRect()
  const a = cible.getBoundingClientRect()
  const clone = source.cloneNode(true) as SVGSVGElement
  clone.setAttribute('aria-hidden', 'true')
  clone.classList.add('g2g-insertion')
  Object.assign(clone.style, { position: 'fixed', left: `${de.left}px`, top: `${de.top}px`, width: `${de.width}px`, height: `${de.height}px`, margin: '0', zIndex: '80', pointerEvents: 'none', transformOrigin: 'top left' })
  document.body.appendChild(clone)
  const echelle = Math.min((a.width - 4) / de.width, (a.height - 4) / de.height)
  const dx = a.left + (a.width - de.width * echelle) / 2 - de.left
  const dy = a.top + (a.height - de.height * echelle) / 2 - de.top
  gsap.fromTo(clone, { x: 0, y: 0, scale: 1, rotate: 0 }, {
    x: dx,
    y: dy,
    scale: echelle,
    rotate: -6,
    duration: DUREE,
    ease: 'power3.in',
    onComplete: () => {
      clone.remove()
      lenis?.start()
    },
  })
}
