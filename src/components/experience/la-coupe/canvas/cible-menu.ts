import { EdgesGeometry, type Group, LineBasicMaterial, LineSegments } from 'three'
import { projets } from '../content/projets'
import { hero } from '../lib/hero-store'
import { survolMenu } from '../lib/menu-cible-store'
import { construireMassing } from './massing'

declare global {
  interface Window {
    __laCoupeMenu?: () => { cible: string; survol: string | null; echecs: string[]; parts: Record<string, number> }
  }
}

/** Un survol ne devient cible qu'après ce temps de pointeur immobile sur la ligne. */
const IMMOBILE_MS = 120
/** Sortie de la liste : retour au modèle par défaut après ce temps de repos. */
const REPOS_MS = 300
const FONDU_MS = 600
const OPACITE = 0.4
const DEFAUT = '__defaut'

/** --ease-ui, cubic-bezier(0.76, 0, 0.24, 1) : quart in-out. */
const ease = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2)

interface Modele {
  materiau: LineBasicMaterial
  lignes: LineSegments | null
  /** Part d'opacité courante, de 0 à 1, et le fondu en cours vers `vers`. */
  part: number
  depuis: number
  vers: number
  debut: number
}

/**
 * Le fil de fer du menu suit le projet survolé. Un modèle par projet, bâti au
 * premier besoin, plus le modèle par défaut (la maquette). Changer de cible
 * lance un fondu croisé de 600 ms qui part toujours des opacités courantes :
 * un seul modèle entre, tous les autres sortent, rien ne repasse par zéro.
 */
export class CibleMenu {
  private modeles = new Map<string, Modele>()
  private cible = DEFAUT
  private echecs = new Set<string>()
  private sonde = false

  constructor(
    private groupe: Group,
    materiauDefaut: LineBasicMaterial,
  ) {
    this.modeles.set(DEFAUT, { materiau: materiauDefaut, lignes: null, part: 1, depuis: 1, vers: 1, debut: 0 })
  }

  private modele(slug: string): Modele | null {
    const connu = this.modeles.get(slug)
    if (connu) return connu
    if (this.echecs.has(slug)) return null
    const projet = projets.find((p) => p.slug === slug)
    let geometrie = null
    try {
      geometrie = projet ? construireMassing(projet) : null
    } catch {
      geometrie = null
    }
    // Un massing impossible à bâtir ne se retente pas à chaque frame : le modèle courant reste.
    if (!geometrie) {
      this.echecs.add(slug)
      return null
    }
    const materiau = new LineBasicMaterial({ color: '#f3f0ea', transparent: true, opacity: 0 })
    const lignes = new LineSegments(new EdgesGeometry(geometrie, 15), materiau)
    lignes.visible = false
    this.groupe.add(lignes)
    const m: Modele = { materiau, lignes, part: 0, depuis: 0, vers: 0, debut: 0 }
    this.modeles.set(slug, m)
    return m
  }

  private viser(cle: string, maintenant: number, fondu: boolean): void {
    if (cle === this.cible) return
    if (cle !== DEFAUT && !this.modele(cle)) return
    this.cible = cle
    for (const [k, m] of this.modeles) {
      m.depuis = m.part
      m.vers = k === cle ? 1 : 0
      m.debut = fondu ? maintenant : maintenant - FONDU_MS
    }
  }

  /** À chaque frame du mode menu. `fondu` est faux sous mouvement réduit : bascule instantanée. */
  frame(maintenant: number, fondu: boolean): void {
    // En développement seulement : lire la cible et les opacités depuis la console (contrôles).
    // Posé ici et non au constructeur : React monte deux rigs en mode strict, un seul tourne.
    if (process.env.NODE_ENV !== 'production' && !this.sonde) {
      this.sonde = true
      window.__laCoupeMenu = () => ({ cible: this.cible, survol: survolMenu.slug, echecs: [...this.echecs], parts: Object.fromEntries([...this.modeles].map(([k, m]) => [k, m.part])) })
    }
    const s = survolMenu
    if (s.slug !== null) {
      if (s.immediat || maintenant - s.dernierMouvement >= IMMOBILE_MS) this.viser(s.slug, maintenant, fondu)
      else hero.sale = true
    } else if (this.cible !== DEFAUT) {
      if (maintenant - s.sortie >= REPOS_MS) this.viser(DEFAUT, maintenant, fondu)
      else hero.sale = true
    }
    for (const m of this.modeles.values()) {
      if (m.part !== m.vers) {
        const t = Math.min(1, (maintenant - m.debut) / FONDU_MS)
        m.part = t >= 1 ? m.vers : m.depuis + (m.vers - m.depuis) * ease(t)
        hero.sale = true
      }
      m.materiau.opacity = OPACITE * m.part
      if (m.lignes) m.lignes.visible = m.part > 0.001
    }
  }

  /** Menu fermé : tout revient au modèle par défaut, sans fondu. */
  reposer(): void {
    this.cible = DEFAUT
    for (const [k, m] of this.modeles) {
      m.part = m.depuis = m.vers = k === DEFAUT ? 1 : 0
      if (m.lignes) m.lignes.visible = false
    }
  }

  dispose(): void {
    for (const m of this.modeles.values()) {
      if (!m.lignes) continue
      this.groupe.remove(m.lignes)
      m.lignes.geometry.dispose()
      m.materiau.dispose()
    }
  }
}
