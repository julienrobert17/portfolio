import { chargerGsap } from '../lib/gsap'
import { getLenis } from '../lib/lenis-store'

const DUREE = 0.45

/**
 * L'insertion : la cassette vole du mur jusqu'à la fenêtre cassette du skin (desktop) ou de la
 * barre du bas (mobile), en FLIP par GSAP, 450 ms. Le clone en vol est la tuile elle-même
 * (mêmes classes, même police au marqueur, mêmes couleurs, même sticker), sans son texte ni son
 * bouton, monté dans la racine .g2g pour hériter des variables de police et de couleur ; il
 * atterrit droit. Positions mesurées après lenis.stop(). La cassette d'origine reste visible
 * pendant le vol. En mouvement réduit, rien : la cassette apparaît directement dans la fenêtre.
 * GSAP est chargé à la demande (préchargé à l'inactivité) : le clone est posé tout de suite, le
 * vol part dès que GSAP est là.
 */
export function insererCassette(tuile: HTMLElement | null): void {
  if (!tuile || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const racine = document.getElementById('haut')
  const source = tuile.querySelector<SVGSVGElement>('.g2g-cassette svg')
  const cibles = Array.from(document.querySelectorAll<HTMLElement>('.g2g-fenetre')).filter((el) => el.offsetParent !== null && el.getClientRects().length)
  const cible = cibles[0]
  if (!racine || !source || !cible) return
  const lenis = getLenis()
  lenis?.stop()
  const de = tuile.getBoundingClientRect()
  const a = cible.getBoundingClientRect()
  const clone = tuile.cloneNode(true) as HTMLElement
  clone.setAttribute('aria-hidden', 'true')
  clone.inert = true
  clone.classList.add('g2g-insertion')
  for (const attr of ['data-collage', 'data-colle', 'data-joue']) clone.removeAttribute(attr)
  for (const el of clone.querySelectorAll('.g2g-cassette__texte, .g2g-ecouter, [id]')) el.remove()
  Object.assign(clone.style, { left: `${de.left}px`, top: `${de.top}px`, width: `${de.width}px` })
  racine.appendChild(clone)
  // La tuile du clone n'a plus que la cassette : sa boîte est celle du SVG non tourné.
  const largeur = de.width
  const hauteur = largeur * (128 / 200)
  const rot = parseFloat(getComputedStyle(clone.querySelector('.g2g-cassette') ?? clone).getPropertyValue('--rot')) || 0
  const echelle = Math.min((a.width - 4) / largeur, (a.height - 4) / hauteur)
  const dx = a.left + (a.width - largeur * echelle) / 2 - de.left
  const dy = a.top + (a.height - hauteur * echelle) / 2 - de.top
  void chargerGsap().then((gsap) => {
    gsap.fromTo(clone, { x: 0, y: 0, scale: 1, rotate: 0 }, {
      x: dx,
      y: dy,
      scale: echelle,
      rotate: -rot,
      duration: DUREE,
      ease: 'power3.in',
      onComplete: () => {
        clone.remove()
        lenis?.start()
      },
    })
  })
}
