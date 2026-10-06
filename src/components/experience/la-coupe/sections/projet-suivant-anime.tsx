'use client'

import { useRef } from 'react'
import { useScrollAnimation } from '../lib/animation'
import { naviguer } from '../lib/navigation-store'

/** Delta de molette ou de toucher, au-delà de la course, qui déclenche la navigation. */
const SEUIL_DELTA = 120

/**
 * Côté client du projet suivant : le bloc (le lien) se découvre de 40vh à 100vh
 * en scrub pendant que son conteneur de 100vh entre dans la vue. Le conteneur
 * a une hauteur fixe, donc le document ne change jamais de taille pendant le
 * scroll : aucun recalcul en boucle. Le départ à « top 60% » correspond au
 * moment où le bas du bloc au repos (40vh) touche le bas du viewport ; de là
 * jusqu'à « top top », la découverte suit exactement le scroll et le bas du
 * bloc reste collé au bas de l'écran. Ensuite le bloc est tenu plein écran
 * (sticky) sur 50vh de maintien. En fin de course, 120 px de molette ou
 * de toucher vers le bas déclenchent la navigation vers la fiche, une seule
 * fois, en continu : le bloc a alors exactement la géométrie du hero cible ; jamais au clavier, jamais sous mouvement réduit
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
    // Le bloc occupe d'emblée ses 100vh et se découvre par clip-path ; la légende suit par transform.
    // Ni hauteur ni position ne changent au scroll : aucun décalage de mise en page (CLS).
    bloc.dataset.anime = ''
    gsap.fromTo(
      bloc,
      { '--coupe': 60 },
      {
        '--coupe': 0,
        ease: 'none',
        scrollTrigger: {
          trigger: conteneur,
          start: 'top 60%',
          end: 'top top',
          scrub: true,
          onUpdate: (st) => {
            enBout = st.progress >= 0.999
            if (!enBout) cumul = 0
          },
        },
      },
    )
    // La page figée : une copie du bloc en fin de course, fixée plein écran hors de la page, tient
    // l'écran pendant que la route change dessous. PageTransition la fond (300 ms) une fois la
    // fiche posée, scroll à 0 : hero identique dessous, seule la ligne mono change.
    const partir = async () => {
      if (declenche) return
      declenche = true
      const fige = bloc.cloneNode(true) as HTMLElement
      fige.removeAttribute('href')
      fige.setAttribute('aria-hidden', 'true')
      fige.dataset.pageFigee = ''
      fige.style.setProperty('--coupe', '0')
      fige.style.visibility = 'hidden'
      bloc.closest('.lc')?.appendChild(fige)
      // L'image de la copie vient du cache mais doit être décodée avant de couvrir, sinon un éclair de LQIP.
      await fige.querySelector('img')?.decode().catch(() => undefined)
      fige.style.visibility = ''
      naviguer({ href: bloc.getAttribute('href') ?? '', type: 'continu', label: bloc.getAttribute('aria-label') ?? '' })
    }
    // Tenu plein écran : course finie et maintien pas encore dépassé (au-delà, c'est le footer).
    const tenu = () => enBout && conteneur.getBoundingClientRect().bottom >= window.innerHeight - 1
    const accumuler = (delta: number) => {
      if (!tenu() || delta <= 0) return
      cumul += delta
      if (cumul >= SEUIL_DELTA) partir()
    }
    // Clic en fin de course : même navigation continue (avant la fin, le lien garde l'élément partagé).
    const clic = (e: MouseEvent) => {
      if (!tenu() || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      partir()
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
    bloc.addEventListener('click', clic, true)
    window.addEventListener('wheel', molette, { passive: true })
    window.addEventListener('touchstart', toucherDebut, { passive: true })
    window.addEventListener('touchmove', toucher, { passive: true })
    return () => {
      delete bloc.dataset.anime
      bloc.removeEventListener('click', clic, true)
      window.removeEventListener('wheel', molette)
      window.removeEventListener('touchstart', toucherDebut)
      window.removeEventListener('touchmove', toucher)
    }
  })
  return <span ref={ancre} hidden />
}
