'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, type Ref } from 'react'
import { categories, projets } from '../content'
import type { Categorie } from '../content/types'
import { MEDIA } from '../lib/animation'
import { chargerFlip, registerGsap } from '../lib/gsap'
import FiltresIndex, { type Vue } from './filtres-index'
import GrilleProjets from './grille-projets'
import IndexProjets from './index-projets'

type PluginFlip = Awaited<ReturnType<typeof chargerFlip>>
type EtatFlip = ReturnType<PluginFlip['getState']>
/** Flip chargé au montage, à la demande ; tant qu'il n'est pas là, le filtre change sans réordonnancement animé. */
let FlipPret: PluginFlip | null = null

/** Ce que la fin de la sortie enregistre, consommé au rendu suivant. */
interface Capture {
  flip: EtatFlip
  anciens: Set<Element>
  scrollY: number
}

const CIBLES = '[data-flip-id]'
/** Séquence stricte : sortie, puis état React, puis Flip, puis entrée. Rien n'entre tant que rien n'est fini de sortir. */
const SEQUENCE = {
  sortie: { duree: 0.25, y: 8, stagger: 0.02, ease: 'power2.out' },
  flip: { duree: 0.4, ease: 'expo.out' },
  entree: { duree: 0.5, y: 16, stagger: 0.04, ease: 'expo.out' },
} as const

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
 * remplacent sans défilement. Changement de filtre, en séquence stricte :
 * les lignes retirées sortent (opacité 0 et 8 px, 250 ms) ; alors seulement
 * l'URL, donc l'état React, change ; les lignes restantes glissent (Flip,
 * 400 ms) ; enfin les nouvelles entrent. Vue liste comme grille. Un second
 * clic pendant la sortie repart de l'état courant vers la nouvelle cible.
 * Sous mouvement réduit, ou tant que Flip n'est pas chargé, rien de tout cela.
 */
export default function ProjetsClient() {
  const params = useSearchParams()
  const router = useRouter()
  const { vue, categorie } = lireEtat(params)
  const conteneurRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<Capture | null>(null)
  const sortieRef = useRef<{ kill(): void } | null>(null)

  const naviguer = (url: string) => {
    const conteneur = conteneurRef.current
    const cible = lireEtat(new URL(url, window.location.origin).searchParams)
    // Séquence seulement quand la vue reste : lignes vers lignes, tuiles vers tuiles.
    const Flip = FlipPret
    const anime = conteneur && Flip && cible.vue === vue && window.matchMedia(MEDIA.anime).matches
    if (!anime) {
      router.replace(url, { scroll: false })
      return
    }
    const { gsap } = registerGsap()
    const lignes = Array.from(conteneur.querySelectorAll<HTMLElement>(CIBLES))
    // Une séquence encore en cours serait mesurée à mi-chemin : on la termine.
    sortieRef.current?.kill()
    Flip.killFlipsOf(lignes)
    gsap.killTweensOf(lignes)
    gsap.set(lignes, { clearProps: 'opacity,transform' })
    const gardes = new Set((cible.categorie ? projets.filter((p) => p.categorie === cible.categorie) : projets).map((p) => p.slug))
    const sortants = lignes.filter((el) => !gardes.has(el.dataset.flipId ?? ''))
    const changer = () => {
      sortieRef.current = null
      captureRef.current = { flip: Flip.getState(lignes, { simple: true }), anciens: new Set(lignes), scrollY: window.scrollY }
      router.replace(url, { scroll: false })
    }
    if (!sortants.length) {
      changer()
      return
    }
    sortieRef.current = gsap.to(sortants, {
      opacity: 0,
      y: SEQUENCE.sortie.y,
      duration: SEQUENCE.sortie.duree,
      ease: SEQUENCE.sortie.ease,
      stagger: SEQUENCE.sortie.stagger,
      onComplete: changer,
    })
  }

  // Flip arrive après le premier rendu, à la demande : le premier filtre est parfois sans Flip.
  useEffect(() => {
    chargerFlip().then((m) => {
      FlipPret = m
    })
  }, [])

  useLayoutEffect(() => {
    const capture = captureRef.current
    const conteneur = conteneurRef.current
    captureRef.current = null
    const Flip = FlipPret
    if (!capture || !conteneur || !Flip) return
    const { gsap } = registerGsap()
    const lignes = Array.from(conteneur.querySelectorAll<HTMLElement>(CIBLES))
    const restants = lignes.filter((el) => capture.anciens.has(el))
    const entrants = lignes.filter((el) => !capture.anciens.has(el))
    // Les nouvelles attendent, invisibles, que les restantes aient fini de glisser.
    gsap.set(entrants, { opacity: 0 })
    let entree: { revert(): void } | null = null
    const entrer = () => {
      if (!entrants.length) return
      entree = gsap.fromTo(
        entrants,
        { opacity: 0, y: SEQUENCE.entree.y },
        { opacity: 1, y: 0, duration: SEQUENCE.entree.duree, ease: SEQUENCE.entree.ease, stagger: SEQUENCE.entree.stagger, clearProps: 'opacity,transform' },
      )
    }
    // La page a défilé entre la capture et le rendu : les mesures ne valent plus, seule l'entrée joue.
    const defile = Math.abs(window.scrollY - capture.scrollY) > 1
    const flip =
      defile || !restants.length
        ? null
        : Flip.from(capture.flip, { targets: restants, duration: SEQUENCE.flip.duree, ease: SEQUENCE.flip.ease, onComplete: entrer })
    if (!flip) entrer()

    return () => {
      // Le revert d'un Flip saute à la fin et nettoie les styles inline.
      flip?.revert()
      entree?.revert()
      gsap.set(entrants, { clearProps: 'opacity,transform' })
    }
  }, [vue, categorie])

  return <VueProjets vue={vue} categorie={categorie} onNaviguer={naviguer} ref={conteneurRef} />
}
