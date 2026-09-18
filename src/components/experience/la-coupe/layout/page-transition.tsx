'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { site } from '../content/site'
import { EASE_UI } from '../lib/easings'
import { registerGsap } from '../lib/gsap'
import { getLenis, recalculerScroll, scrollEnHaut } from '../lib/lenis-store'
import { navigation, setNavigateur, type DemandeNavigation } from '../lib/navigation-store'
import { usePageSettled } from '../lib/use-page-settled'
import styles from './page-transition.module.css'
import { implementation } from './transitions'

interface PageTransitionProps {
  children: ReactNode
}

const DUREE_RIDEAU = 0.5
const REDUIT = '(prefers-reduced-motion: reduce)'

/** Nom d'une page d'après son chemin, pour le rideau des retours navigateur. */
function nomDePage(pathname: string): string {
  const reste = pathname.slice(site.base.length)
  if (!reste || reste === '/') return 'Accueil'
  const item = site.nav.find((n) => reste === n.href || reste.startsWith(`${n.href}/`))
  return item?.label ?? ''
}

/**
 * Seul point de contact entre la navigation et les transitions.
 * - `partage` : élément partagé par l'API View Transitions (voir transitions/).
 * - `rideau` : couche maison — un rideau --paper-2 monte en clip-path (500 ms)
 *   avec le nom de la destination, la page change dessous, puis il se lève.
 * Sous couverture, dans l'ordre : lenis.stop(), scroll à 0, montage,
 * ScrollTrigger.refresh(), lenis.start(), révélation. Retour/avant navigateur :
 * rideau posé d'un coup, scroll restauré par Next. Mouvement réduit : fondu
 * 200 ms en CSS, pas de rideau, pas d'élément partagé qui se déplace.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const router = useRouter()
  const rideau = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const precedent = useRef(pathname)
  const { Wrapper, onCovered, onRevealed } = implementation

  useEffect(() => {
    setNavigateur((demande: DemandeNavigation) => {
      if (demande.href === window.location.pathname) return
      navigation.enCours = demande
      const reduit = window.matchMedia(REDUIT).matches
      getLenis()?.stop()
      if (demande.type === 'partage' && !reduit) {
        navigation.arriveePartagee = true
        router.push(demande.href)
        return
      }
      if (reduit || !rideau.current) {
        router.push(demande.href)
        return
      }
      const { gsap } = registerGsap()
      if (label.current) label.current.textContent = demande.label
      gsap.fromTo(
        rideau.current,
        { '--haut': '100%', '--bas': '0%' },
        { '--haut': '0%', duration: DUREE_RIDEAU, ease: EASE_UI, onComplete: () => router.push(demande.href) },
      )
    })
    return () => setNavigateur(null)
  }, [router])

  // Nouvelle route montée, encore couverte : remise à zéro du scroll.
  useLayoutEffect(() => {
    if (precedent.current === pathname) return
    precedent.current = pathname
    if (navigation.enCours) {
      scrollEnHaut()
    } else if (rideau.current && !window.matchMedia(REDUIT).matches) {
      // Retour ou avant navigateur : le rideau tombe d'un coup, Next restaure le scroll.
      const { gsap } = registerGsap()
      if (label.current) label.current.textContent = nomDePage(pathname)
      gsap.set(rideau.current, { '--haut': '0%', '--bas': '0%' })
      navigation.enCours = { href: pathname, type: 'rideau', label: nomDePage(pathname) }
      getLenis()?.stop()
    }
    onCovered?.(pathname)
  }, [pathname, onCovered])

  // Page prête (polices, images) : recalcul, reprise du défilement, révélation.
  const onSettled = useCallback(() => {
    const { gsap, ScrollTrigger } = registerGsap()
    recalculerScroll()
    ScrollTrigger.refresh()
    getLenis()?.start()
    const demande = navigation.enCours
    navigation.enCours = null
    navigation.arriveePartagee = false
    if (demande?.type === 'rideau' && rideau.current) {
      gsap.to(rideau.current, {
        '--bas': '100%',
        duration: DUREE_RIDEAU,
        ease: EASE_UI,
        onComplete: () => {
          if (rideau.current) gsap.set(rideau.current, { '--haut': '100%', '--bas': '0%' })
        },
      })
    }
    onRevealed?.(pathname)
  }, [onRevealed, pathname])
  usePageSettled(pathname, onSettled)

  return (
    <>
      <Wrapper pathname={pathname}>{children}</Wrapper>
      <div ref={rideau} className={styles.rideau} aria-hidden="true">
        <span ref={label} className={`lc-mono ${styles.label}`} />
      </div>
    </>
  )
}
