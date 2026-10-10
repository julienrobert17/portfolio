'use client'

import { useEffect } from 'react'

/**
 * Arrivée des éléments du mur au défilement : un « collage » court (échelle 1,06 vers 1, la
 * rotation se pose, 220 ms), une seule fois par élément, sans parallaxe (brief §3.6). Pose
 * `data-colle` sur chaque `[data-collage]` quand il entre dans l'écran ; le CSS fait le reste,
 * et rien en mouvement réduit. Ne rend rien.
 */
export default function Collage() {
  useEffect(() => {
    const racine = document.getElementById('haut')
    if (!racine) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue
          ;(e.target as HTMLElement).dataset.colle = ''
          observateur.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.15 },
    )
    const recenser = () => {
      for (const el of racine.querySelectorAll<HTMLElement>('[data-collage]:not([data-colle])')) observateur.observe(el)
    }
    recenser()
    // Les navigations remplacent le contenu de main : on recense à chaque mutation.
    const mutations = new MutationObserver(recenser)
    const main = document.getElementById('contenu')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    return () => {
      observateur.disconnect()
      mutations.disconnect()
    }
  }, [])
  return null
}
