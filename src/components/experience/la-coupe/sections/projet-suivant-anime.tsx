'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'

/**
 * Côté client du projet suivant : le bloc (le lien) grandit de 40vh à 100vh
 * en scrub pendant que son conteneur de 100vh entre dans la vue. Le conteneur
 * a une hauteur fixe, donc le document ne change jamais de taille pendant le
 * scroll : aucun recalcul en boucle. Le départ à « top 60% » correspond au
 * moment où le bas du bloc au repos (40vh) touche le bas du viewport ; de là
 * jusqu'à « bottom bottom », la hauteur suit exactement le scroll et le bas du
 * bloc reste collé au bas de l'écran. Navigation en fin de course : Phase 4.
 * Ancre : un span caché dans le conteneur, à côté du lien.
 */
export default function ProjetSuivantAnime() {
  const ancre = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ancre, ({ gsap, racine }) => {
    const conteneur = racine.parentElement
    const bloc = conteneur?.querySelector<HTMLElement>('a')
    if (!conteneur || !bloc) return
    gsap.fromTo(
      bloc,
      { height: '40vh' },
      {
        height: '100vh',
        ease: 'none',
        scrollTrigger: { trigger: conteneur, start: 'top 60%', end: 'bottom bottom', scrub: true },
      },
    )
  })
  return <span ref={ancre} hidden />
}
