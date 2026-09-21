'use client'

import { useRef } from 'react'
import type { Ratio } from '../content/types'
import { useScrollAnimation } from '../lib/animation'
import { EASE_UI_GSAP } from '../lib/easings'
import { onTick } from '../lib/ticker'
import styles from './image-flottante.module.css'

/** Le cadre prend le ratio de la photo, à surface constante (≈ 52 000 px²). */
const TAILLES: Record<Ratio, [number, number]> = { '4:5': [200, 260], '3:2': [280, 187], '16:9': [304, 171], '1:1': [228, 228] }
const [LARGEUR, HAUTEUR] = TAILLES['4:5']
const tailleDe = (ligne: HTMLElement): [number, number] => TAILLES[ligne.dataset.imageRatio as Ratio] ?? TAILLES['4:5']
const LERP = 0.12
const ROTATION_MAX = 3
const MARGE_FOCUS = 16
/** L'image ne recouvre jamais le curseur : ancrée à cette distance, à droite et sous le point. */
const DECALAGE = 32
const MARGE_BORD = 8

/** Coin haut-gauche de l'image pour un pointeur donné ; bascule à gauche ou au-dessus faute de place. */
function placement(cx: number, cy: number, largeur: number, hauteur: number): [number, number] {
  const x = cx + DECALAGE + largeur > window.innerWidth - MARGE_BORD ? cx - DECALAGE - largeur : cx + DECALAGE
  const y = cy + DECALAGE + hauteur > window.innerHeight - MARGE_BORD ? cy - DECALAGE - hauteur : cy + DECALAGE
  return [x, y]
}

/**
 * Image au ratio de la photo (surface constante, `data-image-ratio` ; largeur et hauteur
 * s'interpolent en 250 ms d'une ligne à l'autre, pendant le fondu) qui accompagne le curseur au survol des lignes `[data-image]`
 * du conteneur parent, ancrée à 32 px à droite et sous le point (lerp 0,12, rotation ±3° selon la vélocité, fondu
 * 250 ms), pointeur fin seulement. Au focus clavier, la même image apparaît
 * ancrée à droite de la ligne. Rien au tactile. À placer dans l'élément qui
 * contient les lignes : les écouteurs sont délégués au parent, les lignes
 * peuvent donc changer (filtres) sans réabonnement.
 */
interface ImageFlottanteProps {
  /**
   * Colle l'image dans la colonne vide entre les `[data-nom]` et les `[data-role]`
   * des lignes : x fixe au centre de cette colonne, y seul suit le pointeur, borné
   * au haut et au bas de la liste. Elle ne recouvre alors ni nom ni rôle.
   */
  colonne?: boolean
}

export default function ImageFlottante({ colonne = false }: ImageFlottanteProps) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollAnimation(
    ref,
    ({ gsap, racine, fin }) => {
    const conteneur = racine.parentElement
    const img = racine.querySelector('img')
    if (!conteneur || !img) return
    const etat = { x: 0, y: 0, cx: 0, cy: 0, visible: false, ancree: false, vx: 0 }
    /** Centre de la colonne vide (entre la fin des noms et le début des rôles), mesuré à la demande. */
    let colonneX: number | null = null
    // Le rectangle du texte, pas celui de la cellule : un nom court laisse sa colonne vide à droite.
    const rectTexte = (e: Element): DOMRect => {
      const plage = document.createRange()
      plage.selectNodeContents(e)
      return plage.getBoundingClientRect()
    }
    const mesurerColonne = () => {
      const noms = conteneur.querySelectorAll<HTMLElement>('[data-nom]')
      const roles = conteneur.querySelectorAll<HTMLElement>('[data-role]')
      if (!noms.length || !roles.length) return
      const fin = Math.max(...Array.from(noms, (e) => rectTexte(e).right))
      const debut = Math.min(...Array.from(roles, (e) => rectTexte(e).left))
      colonneX = (fin + debut) / 2
    }

    // Taille courante du cadre : le décalage et la bascule au bord se calculent toujours avec elle.
    const taille = { w: LARGEUR, h: HAUTEUR }
    const appliquerTaille = () => {
      racine.style.width = `${taille.w}px`
      racine.style.height = `${taille.h}px`
    }
    const montrer = (ligne: HTMLElement) => {
      const src = ligne.dataset.image ?? ''
      const [w, h] = tailleDe(ligne)
      if (!etat.visible) {
        gsap.killTweensOf(taille)
        taille.w = w
        taille.h = h
        appliquerTaille()
      } else if (taille.w !== w || taille.h !== h) {
        gsap.to(taille, { w, h, duration: 0.25, ease: EASE_UI_GSAP, overwrite: true, onUpdate: appliquerTaille })
      }
      if (img.getAttribute('src') !== src) {
        img.src = src
        img.alt = ligne.dataset.imageAlt ?? ''
        if (etat.visible) gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: true })
      }
      etat.visible = true
      gsap.to(racine, { opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: true })
    }
    const cacher = () => {
      etat.visible = false
      etat.ancree = false
      gsap.to(racine, { opacity: 0, duration: 0.25, ease: 'power2.out', overwrite: true })
    }
    const arret = onTick(() => {
      if (!etat.visible || etat.ancree) return
      // `x, y` : coin haut-gauche de l'image, qui rejoint son placement en douceur (bascule comprise).
      let [tx, ty] = placement(etat.cx, etat.cy, taille.w, taille.h)
      if (colonne) {
        if (colonneX === null) mesurerColonne()
        const liste = conteneur.getBoundingClientRect()
        tx = (colonneX ?? etat.cx) - taille.w / 2
        ty = gsap.utils.clamp(liste.top, Math.max(liste.top, liste.bottom - taille.h), etat.cy - taille.h / 2)
      }
      const dx = tx - etat.x
      etat.x += dx * LERP
      etat.y += (ty - etat.y) * LERP
      etat.vx += (dx * LERP - etat.vx) * 0.2
      const rot = gsap.utils.clamp(-ROTATION_MAX, ROTATION_MAX, etat.vx * 0.15)
      racine.style.transform = `translate3d(${etat.x}px, ${etat.y}px, 0) rotate(${rot}deg)`
    })
    const ecouteurs: Array<() => void> = [arret]

    if (fin) {
      const ligneDe = (cible: EventTarget | null) =>
        cible instanceof Element ? cible.closest<HTMLElement>('[data-image]') : null
      const entrer = (e: PointerEvent) => {
        const ligne = ligneDe(e.target)
        // Passage entre deux enfants d'une même ligne : rien à faire.
        if (!ligne || ligne === ligneDe(e.relatedTarget)) return
        etat.ancree = false
        etat.cx = e.clientX
        etat.cy = e.clientY
        if (!etat.visible) {
          ;[etat.x, etat.y] = placement(e.clientX, e.clientY, ...tailleDe(ligne))
          if (colonne) {
            mesurerColonne()
            const [w, h] = tailleDe(ligne)
            const liste = conteneur.getBoundingClientRect()
            etat.x = (colonneX ?? e.clientX) - w / 2
            etat.y = Math.min(Math.max(liste.top, e.clientY - h / 2), Math.max(liste.top, liste.bottom - h))
          }
        }
        montrer(ligne)
      }
      const bouger = (e: PointerEvent) => {
        etat.cx = e.clientX
        etat.cy = e.clientY
        // Ligne retirée sous le pointeur (filtre) : plus rien à suivre.
        if (etat.visible && !etat.ancree && !ligneDe(e.target)) cacher()
      }
      const sortir = (e: PointerEvent) => {
        const ligne = ligneDe(e.target)
        if (ligne && ligne !== ligneDe(e.relatedTarget)) cacher()
      }
      conteneur.addEventListener('pointerover', entrer)
      conteneur.addEventListener('pointermove', bouger, { passive: true })
      conteneur.addEventListener('pointerout', sortir)
      ecouteurs.push(() => {
        conteneur.removeEventListener('pointerover', entrer)
        conteneur.removeEventListener('pointermove', bouger)
        conteneur.removeEventListener('pointerout', sortir)
      })
    }

    // Clavier : ancrée à droite de la ligne, sans suivi.
    const focus = (e: FocusEvent) => {
      const ligne = (e.target as HTMLElement).closest<HTMLElement>('[data-image]')
      if (!ligne) return
      const r = ligne.getBoundingClientRect()
      etat.ancree = true
      const [w, h] = tailleDe(ligne)
      racine.style.transform = `translate3d(${r.right - w - MARGE_FOCUS}px, ${r.top + r.height / 2 - h / 2}px, 0) rotate(0deg)`
      montrer(ligne)
    }
    const blur = (e: FocusEvent) => {
      const suivant = e.relatedTarget as HTMLElement | null
      if (!suivant || !conteneur.contains(suivant)) cacher()
    }
    conteneur.addEventListener('focusin', focus)
    conteneur.addEventListener('focusout', blur)
    ecouteurs.push(() => {
      conteneur.removeEventListener('focusin', focus)
      conteneur.removeEventListener('focusout', blur)
    })
    // Le centre de la colonne dépend de la largeur : il se remesure au redimensionnement.
    if (colonne) {
      const auResize = () => {
        colonneX = null
      }
      window.addEventListener('resize', auResize)
      ecouteurs.push(() => window.removeEventListener('resize', auResize))
    }

    return () => {
      gsap.killTweensOf(taille)
      ecouteurs.forEach((fn) => fn())
    }
    },
    [colonne],
  )
  return (
    <div ref={ref} className={styles.flottante} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- source changée à la volée */}
      <img alt="" width={LARGEUR} height={HAUTEUR} loading="lazy" decoding="async" />
    </div>
  )
}
