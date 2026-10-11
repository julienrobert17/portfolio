'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { DUREE_AVANCE_MS, declencherAvance, figerAvance } from '../canvas/avance'
import { chargerGsap, prechargerGsap } from '../lib/gsap'
import { scrollEnHaut } from '../lib/lenis-store'

const REDUIT = '(prefers-reduced-motion: reduce)'
/** Fondu simple en mouvement réduit. */
const DUREE_FONDU = 0.15

/**
 * La transition de page, l'avance rapide (brief §5, Phase 5) : à chaque changement de chemin,
 * lien ou retour et avance du navigateur, le mur rend 400 ms de bandes de suivi et de décalage
 * chromatique (canvas/avance.ts) et le nouveau contenu est révélé par un balayage horizontal de
 * 400 ms (clip-path sur #contenu, variable --balayage animée par GSAP). Le lecteur vit dans le
 * layout : la lecture continue, le son d'avance rapide part du lecteur au même moment. En
 * mouvement réduit : fondu de 150 ms, pas de distorsion. Retour et avance du navigateur : Next
 * restaure le défilement ; une navigation par lien remonte en haut. Ne rend rien.
 * window.__g2g.figerTransition(p) fige la transition pour les captures.
 */
export default function TransitionPage() {
  const pathname = usePathname()
  const precedent = useRef(pathname)
  const retour = useRef(false)
  const tween = useRef<{ kill(): void } | null>(null)

  // Entrée par navigation côté client (depuis la home du portfolio, par exemple) : le script en
  // ligne du layout n'est pas exécuté par le navigateur, seul un chargement complet le fait.
  // On pose donc aussi ici, avant le premier paint du layout, les marques que ce script pose :
  // `data-js` sur la racine (le CSS montre le lecteur, cache la barre statique) et la classe du
  // document (marge de défilement sous le skin). Bloc 7.3b.
  useLayoutEffect(() => {
    document.getElementById('haut')?.setAttribute('data-js', '')
    document.documentElement.classList.add('g2g-document')
  }, [])

  useEffect(() => {
    prechargerGsap()
    const surPopstate = () => {
      retour.current = true
    }
    window.addEventListener('popstate', surPopstate)
    const figerTransition = (p: number | null) => {
      const main = document.getElementById('contenu')
      tween.current?.kill()
      figerAvance(p)
      if (!main) return
      if (p === null) {
        main.removeAttribute('data-balayage')
        main.style.removeProperty('--balayage')
      } else {
        main.setAttribute('data-balayage', '')
        main.style.setProperty('--balayage', `${Math.round((1 - p) * 100)}%`)
      }
    }
    window.__g2g = { flux: () => null, mesure: () => undefined, position: () => -1, etatAudio: () => 'absent', ...window.__g2g, figerTransition }
    return () => {
      window.removeEventListener('popstate', surPopstate)
      document.documentElement.classList.remove('g2g-document')
    }
  }, [])

  // Nouvelle route montée, pas encore peinte : le balayage part du bord gauche.
  useLayoutEffect(() => {
    if (precedent.current === pathname) return
    precedent.current = pathname
    const main = document.getElementById('contenu')
    const parRetour = retour.current
    retour.current = false
    if (!parRetour) scrollEnHaut()
    if (!main) return
    const reduit = window.matchMedia(REDUIT).matches
    tween.current?.kill()
    if (reduit) {
      main.style.opacity = '0'
      void chargerGsap().then((gsap) => {
        tween.current = gsap.fromTo(main, { opacity: 0 }, { opacity: 1, duration: DUREE_FONDU, ease: 'none', clearProps: 'opacity' })
      })
      return
    }
    declencherAvance()
    // État de départ posé avant le premier rendu ; le tween part dès que GSAP (préchargé) répond.
    main.setAttribute('data-balayage', '')
    main.style.setProperty('--balayage', '100%')
    void chargerGsap().then((gsap) => {
      if (!main.hasAttribute('data-balayage')) return
      tween.current = gsap.fromTo(main, { '--balayage': '100%' }, {
        '--balayage': '0%',
        duration: DUREE_AVANCE_MS / 1000,
        ease: 'power2.out',
        onComplete: () => {
          main.removeAttribute('data-balayage')
          main.style.removeProperty('--balayage')
        },
      })
    })
  }, [pathname])

  return null
}
