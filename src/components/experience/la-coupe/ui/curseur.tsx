'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { MEDIA } from '../lib/animation'
import { onTick } from '../lib/ticker'
import styles from './curseur.module.css'

type Etat = 'default' | 'link' | 'view'

const LERP = 0.15

/** Réglages rapides du curseur : tailles en pixels et libellé de l'état « voir ». */
export const REGLAGES_CURSEUR = {
  point: 8,
  lien: 40,
  voir: 56,
  libelle: 'Voir',
} as const
const REDUIT = '(prefers-reduced-motion: reduce)'

/** État demandé par l'élément sous le pointeur, par délégation. */
function etatDe(cible: EventTarget | null): Etat {
  if (!(cible instanceof Element)) return 'default'
  // Un état explicite l'emporte : `view` sur les blocs, `default` sur les lignes d'index
  // (l'image flottante y est l'affordance, le curseur reste un point).
  const explicite = cible.closest<HTMLElement>('[data-curseur]')?.dataset.curseur
  if (explicite === 'view' || explicite === 'default' || explicite === 'link') return explicite
  if (cible.closest('a, button')) return 'link'
  return 'default'
}

/**
 * Branche le curseur sur le document. Retourne la fonction qui débranche
 * tout et rend le curseur natif.
 */
function brancher(racine: HTMLElement, reduit: MediaQueryList): () => void {
  const html = document.documentElement
  const etat = { x: 0, y: 0, cx: 0, cy: 0, visible: false, courant: 'default' as Etat }
  const nettoyages: Array<() => void> = []
  let debranche = false

  const debrancher = () => {
    if (debranche) return
    debranche = true
    for (const fn of nettoyages) fn()
    html.classList.remove(styles.actif)
    delete html.dataset.curseurActif
    racine.dataset.visible = 'false'
  }

  /** Une exception dans un écouteur ne doit jamais laisser le document sans curseur. */
  const sur = <E extends Event>(fn: (e: E) => void) => (e: E) => {
    try {
      fn(e)
    } catch {
      debrancher()
    }
  }

  const ecouter = <K extends keyof DocumentEventMap>(
    type: K,
    fn: (e: DocumentEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => {
    const protege = sur(fn)
    document.addEventListener(type, protege, options)
    nettoyages.push(() => document.removeEventListener(type, protege))
  }

  const changerEtat = (suivant: Etat) => {
    if (etat.courant === suivant) return
    etat.courant = suivant
    racine.dataset.etat = suivant
  }
  const cacher = () => {
    if (!etat.visible) return
    etat.visible = false
    racine.dataset.visible = 'false'
  }

  ecouter(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return
      etat.cx = e.clientX
      etat.cy = e.clientY
      if (!etat.visible) {
        // Premier mouvement (ou retour dans la fenêtre) : pas de trajet depuis 0,0.
        etat.x = e.clientX
        etat.y = e.clientY
        etat.visible = true
        racine.dataset.visible = 'true'
        changerEtat(etatDe(e.target))
      }
    },
    { passive: true },
  )
  ecouter('pointerover', (e) => {
    if (e.pointerType === 'touch') return
    changerEtat(etatDe(e.target))
  })
  ecouter('pointerout', (e) => {
    // relatedTarget nul : le pointeur a quitté la fenêtre.
    if (e.relatedTarget === null) {
      changerEtat('default')
      cacher()
    }
  })
  ecouter('mouseleave', () => {
    changerEtat('default')
    cacher()
  })

  nettoyages.push(
    onTick(() => {
      if (!etat.visible) return
      const dx = etat.cx - etat.x
      const dy = etat.cy - etat.y
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return
      const facteur = reduit.matches ? 1 : LERP
      etat.x += dx * facteur
      etat.y += dy * facteur
      racine.style.transform = `translate3d(${etat.x}px, ${etat.y}px, 0)`
    }),
  )

  html.classList.add(styles.actif)
  html.dataset.curseurActif = ''
  return debrancher
}

const VARIABLES = {
  '--c-point': `${REGLAGES_CURSEUR.point}px`,
  '--c-voir': `${REGLAGES_CURSEUR.voir}px`,
  '--c-echelle-lien': String(REGLAGES_CURSEUR.lien / REGLAGES_CURSEUR.voir),
} as CSSProperties

/**
 * Curseur en `difference` (voir le CSS pour la chaîne de mélange) : point de
 * 8 px, anneau de 40 px sur les liens et boutons, anneau de 56 px « Voir » sur
 * `[data-curseur="view"]`, point conservé sur `[data-curseur="default"]`.
 * Tailles et libellé dans REGLAGES_CURSEUR.
 * Pointeur fin seulement (activé et désactivé au gré de `(pointer: fine)`),
 * caché avant le premier mouvement et quand la souris quitte la fenêtre.
 * Sous reduced motion il reste monté mais suit sans lerp. États délégués
 * au document : les éléments ajoutés après montage sont couverts.
 */
export default function Curseur() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const racine = ref.current
    if (!racine) return
    const fin = window.matchMedia(MEDIA.fin)
    const reduit = window.matchMedia(REDUIT)
    let debrancher: (() => void) | null = null
    const evaluer = () => {
      if (fin.matches && !debrancher) debrancher = brancher(racine, reduit)
      else if (!fin.matches && debrancher) {
        debrancher()
        debrancher = null
      }
    }
    evaluer()
    fin.addEventListener('change', evaluer)
    return () => {
      fin.removeEventListener('change', evaluer)
      debrancher?.()
    }
  }, [])

  return (
    <div ref={ref} className={styles.curseur} style={VARIABLES} data-etat="default" data-visible="false" aria-hidden="true">
      <div className={styles.point} />
      <div className={styles.anneau}>
        <span className={styles.libelle}>{REGLAGES_CURSEUR.libelle}</span>
      </div>
    </div>
  )
}
