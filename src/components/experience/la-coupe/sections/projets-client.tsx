'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef, type Ref } from 'react'
import { categories, projets } from '../content'
import type { Categorie } from '../content/types'
import { ENTREE, MEDIA } from '../lib/animation'
import { registerGsap } from '../lib/gsap'
import FiltresIndex, { type Vue } from './filtres-index'
import GrilleProjets from './grille-projets'
import IndexProjets from './index-projets'

type EtatFlip = ReturnType<ReturnType<typeof registerGsap>['Flip']['getState']>

/** Une ligne avant le changement, placée dans son parent : de quoi la laisser s'estomper une fois retirée. */
interface Position {
  el: HTMLElement
  parent: HTMLElement
  top: number
  left: number
  width: number
  height: number
}

/** Ce que le clic sur un filtre enregistre, consommé au rendu suivant. */
interface Capture {
  flip: EtatFlip
  positions: Position[]
  scrollY: number
}

/** Lignes et tuiles vivantes ; les fantômes en cours de sortie sont exclus. */
const CIBLES = '[data-flip-id]:not([data-fantome])'
const FLIP = { duree: 0.6, ease: 'expo.out', sortie: 0.3 } as const

interface EtatUrl {
  vue: Vue
  categorie: Categorie | null
}

function lireEtat(params: { get(nom: string): string | null }): EtatUrl {
  const vue: Vue = params.get('vue') === 'grille' ? 'grille' : 'liste'
  const demande = params.get('programme')
  return { vue, categorie: categories.find((c) => c === demande) ?? null }
}

interface VueProjetsProps extends EtatUrl {
  onNaviguer?: (url: string) => void
  ref?: Ref<HTMLDivElement>
}

/**
 * Barre de filtres puis liste ou grille. Sert aussi de repli statique du
 * Suspense (état par défaut : liste, tous), servi dans le HTML.
 */
export function VueProjets({ vue, categorie, onNaviguer, ref }: VueProjetsProps) {
  const filtres = categorie ? projets.filter((p) => p.categorie === categorie) : projets
  return (
    <>
      <FiltresIndex vue={vue} categorie={categorie} onNaviguer={onNaviguer} />
      <div ref={ref} style={{ paddingTop: 'var(--s-6)' }}>
        {vue === 'grille' ? <GrilleProjets projets={filtres} /> : <IndexProjets projets={filtres} nu />}
      </div>
    </>
  )
}

/**
 * L'état (vue, filtre) se lit dans l'URL côté client ; les filtres la
 * remplacent sans défilement. Au changement de filtre, les lignes restantes
 * glissent (Flip), les entrantes apparaissent, les sortantes s'estompent :
 * React les a retirées, on les réinsère hors flux le temps du fondu.
 * Sous mouvement réduit, rien de tout cela.
 */
export default function ProjetsClient() {
  const params = useSearchParams()
  const router = useRouter()
  const { vue, categorie } = lireEtat(params)
  const conteneurRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<Capture | null>(null)

  const naviguer = (url: string) => {
    const conteneur = conteneurRef.current
    const cible = lireEtat(new URL(url, window.location.origin).searchParams)
    // Flip seulement quand la vue reste : lignes vers lignes, tuiles vers tuiles.
    const anime = conteneur && cible.vue === vue && cible.categorie !== categorie && window.matchMedia(MEDIA.anime).matches
    if (anime) {
      const { gsap, Flip } = registerGsap()
      const lignes = Array.from(conteneur.querySelectorAll<HTMLElement>(CIBLES))
      // Un Flip ou une entrée encore en cours serait mesuré à mi-chemin : on les termine.
      Flip.killFlipsOf(lignes)
      gsap.killTweensOf(lignes)
      gsap.set(lignes, { clearProps: 'opacity,transform' })
      captureRef.current = {
        flip: Flip.getState(lignes, { simple: true }),
        positions: lignes.flatMap((el) => {
          const parent = el.parentElement
          if (!parent) return []
          const r = el.getBoundingClientRect()
          const p = parent.getBoundingClientRect()
          return [{ el, parent, top: r.top - p.top, left: r.left - p.left, width: r.width, height: r.height }]
        }),
        scrollY: window.scrollY,
      }
    }
    router.replace(url, { scroll: false })
  }

  useLayoutEffect(() => {
    const capture = captureRef.current
    const conteneur = conteneurRef.current
    captureRef.current = null
    if (!capture || !conteneur) return
    const { gsap, Flip } = registerGsap()
    const lignes = Array.from(conteneur.querySelectorAll<HTMLElement>(CIBLES))

    // Fantômes : les lignes retirées par React, réinsérées en absolu (donc sans
    // effet sur le flux) le temps de s'estomper, inertes pour le clavier et le pointeur.
    const fantomes = capture.positions.filter((p) => !p.el.isConnected && p.parent.isConnected)
    for (const { el, parent, top, left, width, height } of fantomes) {
      el.setAttribute('data-fantome', '')
      el.setAttribute('aria-hidden', 'true')
      el.setAttribute('inert', '')
      const s = el.style
      s.position = 'absolute'
      s.top = `${top}px`
      s.left = `${left}px`
      s.width = `${width}px`
      s.height = `${height}px`
      s.margin = '0'
      s.gridArea = 'auto'
      s.pointerEvents = 'none'
      parent.appendChild(el)
    }
    const retirer = () => fantomes.forEach((f) => f.el.remove())
    const sortie = fantomes.length
      ? gsap.to(
          fantomes.map((f) => f.el),
          { opacity: 0, duration: FLIP.sortie, ease: 'power2.out', onComplete: retirer },
        )
      : null

    const entrer = (els: Element[]) =>
      gsap.from(els, { opacity: 0, y: 24, duration: FLIP.duree, ease: FLIP.ease, stagger: ENTREE.stagger })

    // La page a défilé entre la capture et le rendu : les mesures ne valent plus, seule l'entrée joue.
    const defile = Math.abs(window.scrollY - capture.scrollY) > 1
    const anciens = new Set(capture.positions.map((p) => p.el))
    const entrants = lignes.filter((el) => !anciens.has(el))
    const anim = defile
      ? entrants.length
        ? entrer(entrants)
        : null
      : Flip.from(capture.flip, { targets: lignes, duration: FLIP.duree, ease: FLIP.ease, onEnter: entrer })

    return () => {
      // Le revert d'un Flip saute à la fin et nettoie les styles inline.
      anim?.revert()
      sortie?.kill()
      retirer()
    }
  }, [vue, categorie])

  return <VueProjets vue={vue} categorie={categorie} onNaviguer={naviguer} ref={conteneurRef} />
}
