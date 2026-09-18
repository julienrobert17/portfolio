'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { registerGsap } from '../lib/gsap'
import { getLenis, scrollEnHaut } from '../lib/lenis-store'
import {
  abonnerPrechargeur,
  attendreReel,
  deciderPrechargeur,
  DUREE_AVANCE,
  DUREE_FIN,
  DUREE_MAX,
  DUREE_MIN,
  DUREE_SORTIE,
  lirePhasePrechargeur,
  lirePhasePrechargeurServeur,
  setPhasePrechargeur,
} from '../lib/prechargeur'
import styles from './prechargeur.module.css'

type Split = InstanceType<ReturnType<typeof registerGsap>['SplitText']>

/** Palier visuel atteint tant que le réel n'est pas prêt. */
const PALIER_ATTENTE = 90
/** Pas des annonces aux lecteurs d'écran : 25, 50, 75, 100. */
const PAS_ANNONCE = 25

const libelleAnnonce = (pct: number) => `Chargement, ${pct} %`

/**
 * Préchargeur de l'accueil : un calque papier au-dessus de tout, une cote
 * qui se trace au rythme du réel (polices, puis première frame du canvas ou
 * repli statique), bornée entre 900 et 2500 ms. À la sortie, le calque se
 * lève par clip-path pendant que le titre du hero entre par lignes.
 *
 * Rendu serveur : rien. La décision est prise dans un effet de layout à
 * l'hydratation et lue par useSyncExternalStore ; le calque est donc posé au
 * premier rendu client qui suit. Le HTML serveur reste visible entre son
 * premier paint et cet instant (l'hydratation, puis au plus une frame) :
 * accepté, pour ne pas dépendre d'un script inline hors React.
 *
 * Aucun état n'est posé sur le contenu de la page : le hero est révélé par
 * des `from` GSAP qui nettoient derrière eux, et le canvas se charge
 * indépendamment.
 */
export default function Prechargeur() {
  const pathname = usePathname()
  const phase = useSyncExternalStore(abonnerPrechargeur, lirePhasePrechargeur, lirePhasePrechargeurServeur)
  const calque = useRef<HTMLDivElement>(null)
  const cote = useRef<HTMLDivElement>(null)
  const compteur = useRef<HTMLSpanElement>(null)
  const annonce = useRef<HTMLSpanElement>(null)

  // Décision avant le premier paint qui suit l'hydratation ; idempotente (Strict Mode, navigations).
  useLayoutEffect(() => {
    deciderPrechargeur(pathname)
  }, [pathname])

  // Affichage : scroll gelé en haut, progression tweenée qui suit le réel.
  useEffect(() => {
    if (phase !== 'affiche') return
    const racine = calque.current
    const laCote = cote.current
    const leCompteur = compteur.current
    const lAnnonce = annonce.current
    if (!racine || !laCote || !leCompteur || !lAnnonce) return
    const { gsap } = registerGsap()

    // Gel du défilement : Lenis s'il existe (créé dans les effets de SmoothScroll,
    // joués avant celui-ci), sinon overflow sur body. Toujours depuis le haut.
    scrollEnHaut()
    document.documentElement.scrollTop = 0
    const lenis = getLenis()
    const overflowAvant = document.body.style.overflow
    if (lenis) lenis.stop()
    else document.body.style.overflow = 'hidden'

    const proxy = { p: 0 }
    let palierAnnonce = 0
    const appliquer = () => {
      laCote.style.setProperty('--p', (proxy.p / 100).toFixed(4))
      const entier = Math.round(proxy.p)
      leCompteur.textContent = String(entier)
      // Annonce aux paliers seulement, jamais à chaque frame.
      const palier = Math.floor(entier / PAS_ANNONCE) * PAS_ANNONCE
      if (palier !== palierAnnonce) {
        palierAnnonce = palier
        racine.setAttribute('aria-label', libelleAnnonce(palier))
        lAnnonce.textContent = libelleAnnonce(palier)
      }
    }

    const debut = performance.now()
    const avance = gsap.to(proxy, {
      p: PALIER_ATTENTE,
      duration: DUREE_AVANCE / 1000,
      ease: 'power2.out',
      onUpdate: appliquer,
    })
    let fin: gsap.core.Tween | null = null
    let timerFin: number | null = null

    const terminer = () => {
      if (fin) return
      avance.kill()
      fin = gsap.to(proxy, {
        p: 100,
        duration: DUREE_FIN / 1000,
        ease: 'power1.inOut',
        onUpdate: appliquer,
        onComplete: () => setPhasePrechargeur('sortie'),
      })
    }
    // Prêt : on achève, sans que la sortie ne commence avant DUREE_MIN.
    const offReel = attendreReel(() => {
      const ecoule = performance.now() - debut
      timerFin = window.setTimeout(terminer, Math.max(0, DUREE_MIN - DUREE_FIN - ecoule))
    })
    // Plafond : on sort quoi qu'il arrive.
    const timerMax = window.setTimeout(terminer, DUREE_MAX - DUREE_FIN)

    return () => {
      offReel()
      window.clearTimeout(timerMax)
      if (timerFin !== null) window.clearTimeout(timerFin)
      avance.kill()
      fin?.kill()
      if (lenis) lenis.start()
      else document.body.style.overflow = overflowAvant
    }
  }, [phase])

  // Sortie : le calque se lève (CSS), le hero se révèle (GSAP), puis démontage.
  useEffect(() => {
    if (phase !== 'sortie') return
    const { gsap, SplitText } = registerGsap()
    const titre = document.querySelector<HTMLElement>('[data-hero="titre"]')
    const scene = document.querySelector<HTMLElement>('[data-hero="scene"]')
    const tl = gsap.timeline()
    let split: Split | null = null

    if (titre) {
      split = SplitText.create(titre, { type: 'lines', mask: 'lines', aria: 'auto' })
      tl.from(
        split.lines,
        {
          yPercent: 100,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.08,
          onComplete: () => {
            split?.revert()
            split = null
          },
        },
        0,
      )
    }
    if (scene) {
      // Ligne mono, cote et maquette : tout sauf le titre et le texte caché.
      const autres = scene.querySelectorAll<HTMLElement>(':scope > p.lc-mono, [data-hero="maquette"]')
      if (autres.length) tl.from(autres, { opacity: 0, duration: 0.6, ease: 'power1.out', clearProps: 'opacity' }, 0)
    }

    // Démontage quand la levée du calque et la révélation sont toutes deux finies.
    const attente = Math.max(DUREE_SORTIE, tl.duration() * 1000)
    const timer = window.setTimeout(() => setPhasePrechargeur('fini'), attente)

    return () => {
      window.clearTimeout(timer)
      tl.kill()
      split?.revert()
      split = null
    }
  }, [phase])

  if (phase !== 'affiche' && phase !== 'sortie') return null

  return (
    <div
      ref={calque}
      className={styles.calque}
      role="status"
      aria-live="polite"
      aria-label={libelleAnnonce(0)}
      data-sortie={phase === 'sortie' || undefined}
    >
      <span ref={annonce} className="lc-visually-hidden">
        {libelleAnnonce(0)}
      </span>
      <div ref={cote} className={styles.cote} aria-hidden="true">
        <div className={styles.trait}>
          <span className={`${styles.tiret} ${styles.tiretDebut}`} />
          <span className={styles.ligne} />
          <span className={`${styles.tiret} ${styles.tiretFin}`} />
        </div>
        <div className={styles.legende}>
          <span className="lc-mono lc-muted">Chargement</span>
          <span ref={compteur} className={`lc-mono ${styles.compteur}`}>
            0
          </span>
        </div>
      </div>
    </div>
  )
}
