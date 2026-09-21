'use client'

import { navigation } from '../lib/navigation-store'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { getLenis } from '../lib/lenis-store'

const SEUIL = 80
/** Largeur de la vignette servant à lire la luminance d'une image sous la nav. */
const VIGNETTE = 48
/** Au-dessus de cette luminance moyenne (0-1, linéaire) la nav passe en encre ; en dessous, en papier voilé. */
const SEUIL_CLAIR = 0.25
/** Les images du contenu, hors image flottante (aria-hidden) qui suit le curseur. */
const IMAGES = 'main img:not([aria-hidden="true"] img)'

type Tonalite = 'clair' | 'sombre'

/**
 * La nav se cache au défilement vers le bas et réapparaît vers le haut ;
 * le nom cède la place aux initiales après un viewport. Direction lue
 * depuis Lenis quand il tourne, sinon depuis la fenêtre.
 *
 * Garde de contraste : la nav est en `mix-blend-mode: difference`, ce qui
 * tombe à 1:1 sur les tons moyens des images. Un IntersectionObserver
 * (bande de la nav comme zone racine) sait quelles images passent dessous ;
 * à chaque frame de défilement on lit la luminance moyenne de la bande
 * d'image sous la nav (vignette canvas mise en cache par image) et on pose
 * `data-image="clair"` (texte encre) ou `"sombre"` (texte papier sur voile
 * encre à 35 %) — la différence est alors désactivée par le CSS. Image
 * illisible (canvas teinté, pas encore chargée) : « sombre » par défaut.
 */
export default function NavComportement() {
  const ancre = useRef<HTMLSpanElement>(null)
  const pathname = usePathname()

  // Relancé à chaque route : l'état repart de zéro, la nav est visible à l'arrivée sur toute page.
  useEffect(() => {
    const header = ancre.current?.closest('header')
    if (!header) return
    let precedent = window.scrollY
    let ticket = 0
    // Arrivée : visible tant qu'on n'a pas défilé de 40 px vers le bas depuis la position d'arrivée
    // (connue une fois la transition finie : scroll remis à zéro, ou restauré au retour navigateur).
    let arrivee = true
    let yArrivee: number | null = null

    // ── Images sous la nav ─────────────────────────────────────────────
    const sousLaNav = new Set<HTMLImageElement>()
    const vignettes = new WeakMap<HTMLImageElement, ImageData | null>()

    /** Vignette réduite de l'image, une fois par image ; null si illisible. */
    const vignette = (img: HTMLImageElement): ImageData | null => {
      const connue = vignettes.get(img)
      if (connue !== undefined) return connue
      if (!img.complete || !img.naturalWidth) return null
      let donnees: ImageData | null = null
      try {
        const canvas = document.createElement('canvas')
        canvas.width = VIGNETTE
        canvas.height = Math.max(1, Math.round((VIGNETTE * img.naturalHeight) / img.naturalWidth))
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          donnees = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }
      } catch {
        donnees = null
      }
      vignettes.set(img, donnees)
      return donnees
    }

    const lineaire = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }

    /** Luminance moyenne de la partie de l'image située sous la bande de la nav, ou null. */
    const luminanceBande = (img: HTMLImageElement): number | null => {
      const v = vignette(img)
      if (!v) return null
      const r = img.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return null
      const bandeHaut = Math.max(0, r.top)
      const bandeBas = Math.min(header.offsetHeight, r.bottom)
      if (bandeBas <= bandeHaut) return null
      // Zone de l'image visible dans son cadre (object-fit: cover recadre, sinon la boîte suit l'image).
      const cover = getComputedStyle(img).objectFit === 'cover'
      const echelle = cover ? Math.max(r.width / v.width, r.height / v.height) : r.width / v.width
      const decalageY = cover ? (r.height - v.height * echelle) / 2 : 0
      const decalageX = cover ? (r.width - v.width * echelle) / 2 : 0
      const y0 = Math.max(0, Math.floor((bandeHaut - r.top - decalageY) / echelle))
      const y1 = Math.min(v.height, Math.ceil((bandeBas - r.top - decalageY) / echelle))
      const x0 = Math.max(0, Math.floor((Math.max(0, r.left) - r.left - decalageX) / echelle))
      const x1 = Math.min(v.width, Math.ceil((Math.min(window.innerWidth, r.right) - r.left - decalageX) / echelle))
      if (y1 <= y0 || x1 <= x0) return null
      let somme = 0
      let n = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * v.width + x) * 4
          somme += 0.2126 * lineaire(v.data[i]) + 0.7152 * lineaire(v.data[i + 1]) + 0.0722 * lineaire(v.data[i + 2])
          n++
        }
      }
      return n ? somme / n : null
    }

    /** Tonalité de ce qui passe sous la nav : moyenne pondérée par la largeur des images, sombre si illisible. */
    const tonalite = (): Tonalite | null => {
      let somme = 0
      let poids = 0
      let presente = false
      for (const img of sousLaNav) {
        const r = img.getBoundingClientRect()
        if (r.bottom <= 0 || r.top >= header.offsetHeight) continue
        presente = true
        const l = luminanceBande(img)
        if (l === null) continue
        somme += l * r.width
        poids += r.width
      }
      if (!presente) return null
      if (!poids) return 'sombre'
      return somme / poids > SEUIL_CLAIR ? 'clair' : 'sombre'
    }

    const lire = () => {
      ticket = 0
      const y = window.scrollY
      const lenis = getLenis()
      const direction = lenis ? lenis.direction : Math.sign(y - precedent)
      precedent = y
      if (arrivee && !navigation.enCours) {
        yArrivee ??= y
        if (y - yArrivee > 40) arrivee = false
      }
      const cachee = !arrivee && direction > 0 && y > SEUIL
      const reduite = y > window.innerHeight
      if (header.dataset.cachee !== String(cachee)) header.dataset.cachee = String(cachee)
      if (header.dataset.reduite !== String(reduite)) header.dataset.reduite = String(reduite)
      const ton = tonalite()
      if (ton === null) {
        if ('image' in header.dataset) delete header.dataset.image
      } else if (header.dataset.image !== ton) {
        header.dataset.image = ton
      }
    }
    const demander = () => {
      if (!ticket) ticket = window.requestAnimationFrame(lire)
    }

    // Zone racine : la bande de la nav, du haut de la fenêtre jusqu'à --nav-h.
    // Le rootMargin dépend de la hauteur de fenêtre : l'observateur est recréé au redimensionnement.
    const observees = new Set<HTMLImageElement>()
    const auChargement = () => demander()
    const creerObservateur = () =>
      new IntersectionObserver(
        (entrees) => {
          for (const e of entrees) {
            if (e.isIntersecting) sousLaNav.add(e.target as HTMLImageElement)
            else sousLaNav.delete(e.target as HTMLImageElement)
          }
          demander()
        },
        { rootMargin: `0px 0px ${header.offsetHeight - window.innerHeight}px 0px`, threshold: 0 },
      )
    let observateur = creerObservateur()
    const recenser = () => {
      const actuelles = new Set(document.querySelectorAll<HTMLImageElement>(IMAGES))
      for (const img of observees) {
        if (!actuelles.has(img)) {
          observateur.unobserve(img)
          img.removeEventListener('load', auChargement)
          observees.delete(img)
          sousLaNav.delete(img)
        }
      }
      for (const img of actuelles) {
        if (!observees.has(img)) {
          observateur.observe(img)
          // La vignette se lit après chargement : on relit la tonalité à ce moment-là.
          img.addEventListener('load', auChargement)
          observees.add(img)
        }
      }
    }
    let ticketResize = 0
    const auResize = () => {
      if (ticketResize) return
      ticketResize = window.requestAnimationFrame(() => {
        ticketResize = 0
        observateur.disconnect()
        sousLaNav.clear()
        observateur = creerObservateur()
        for (const img of observees) observateur.observe(img)
        demander()
      })
    }
    // Les transitions de page remplacent le contenu de <main> : on recense à chaque mutation.
    let ticketRecensement = 0
    const mutations = new MutationObserver(() => {
      if (!ticketRecensement) {
        ticketRecensement = window.requestAnimationFrame(() => {
          ticketRecensement = 0
          recenser()
        })
      }
    })
    const main = document.getElementById('contenu')
    if (main) mutations.observe(main, { childList: true, subtree: true })
    recenser()

    window.addEventListener('scroll', demander, { passive: true })
    window.addEventListener('resize', auResize, { passive: true })
    lire()
    return () => {
      window.removeEventListener('scroll', demander)
      window.removeEventListener('resize', auResize)
      if (ticket) window.cancelAnimationFrame(ticket)
      if (ticketRecensement) window.cancelAnimationFrame(ticketRecensement)
      if (ticketResize) window.cancelAnimationFrame(ticketResize)
      mutations.disconnect()
      observateur.disconnect()
      for (const img of observees) img.removeEventListener('load', auChargement)
      delete header.dataset.cachee
      delete header.dataset.reduite
      delete header.dataset.image
    }
  }, [pathname])

  return <span ref={ancre} hidden />
}
