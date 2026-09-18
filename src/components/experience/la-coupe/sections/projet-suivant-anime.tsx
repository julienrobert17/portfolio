'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'
import { naviguer } from '../lib/navigation-store'

/** Delta de molette ou de toucher, au-delà de la course, qui déclenche la navigation. */
const SEUIL_DELTA = 120

/**
 * Côté client du projet suivant : le bloc (le lien) grandit de 40vh à 100vh
 * en scrub pendant que son conteneur de 100vh entre dans la vue. Le conteneur
 * a une hauteur fixe, donc le document ne change jamais de taille pendant le
 * scroll : aucun recalcul en boucle. Le départ à « top 60% » correspond au
 * moment où le bas du bloc au repos (40vh) touche le bas du viewport ; de là
 * jusqu'à « bottom bottom », la hauteur suit exactement le scroll et le bas du
 * bloc reste collé au bas de l'écran. En fin de course, 120 px de molette ou
 * de toucher vers le bas déclenchent la navigation vers la fiche (élément
 * partagé), une seule fois ; jamais au clavier, jamais sous mouvement réduit
 * (rien n'est monté ici). Ancre : un span caché dans le conteneur.
 */
export default function ProjetSuivantAnime() {
  const ancre = useRef<HTMLSpanElement>(null)
  useScrollAnimation(ancre, ({ gsap, racine }) => {
    const conteneur = racine.parentElement
    const bloc = conteneur?.querySelector<HTMLElement>('a')
    if (!conteneur || !bloc) return
    let enBout = false
    let declenche = false
    let cumul = 0
    let dernierY = 0
    gsap.fromTo(
      bloc,
      { height: '40vh' },
      {
        height: '100vh',
        ease: 'none',
        scrollTrigger: {
          trigger: conteneur,
          start: 'top 60%',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (st) => {
            enBout = st.progress >= 0.999
            if (!enBout) cumul = 0
          },
        },
      },
    )
    const partir = () => {
      if (declenche) return
      declenche = true
      naviguer({ href: bloc.getAttribute('href') ?? '', type: 'partage', label: bloc.textContent?.trim() ?? '' })
    }
    const accumuler = (delta: number) => {
      if (!enBout || delta <= 0) return
      cumul += delta
      if (cumul >= SEUIL_DELTA) partir()
    }
    const molette = (e: WheelEvent) => accumuler(e.deltaY)
    const toucherDebut = (e: TouchEvent) => {
      dernierY = e.touches[0]?.clientY ?? 0
    }
    const toucher = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? dernierY
      accumuler(dernierY - y)
      dernierY = y
    }
    window.addEventListener('wheel', molette, { passive: true })
    window.addEventListener('touchstart', toucherDebut, { passive: true })
    window.addEventListener('touchmove', toucher, { passive: true })
    return () => {
      window.removeEventListener('wheel', molette)
      window.removeEventListener('touchstart', toucherDebut)
      window.removeEventListener('touchmove', toucher)
    }
  })
  return <span ref={ancre} hidden />
}
