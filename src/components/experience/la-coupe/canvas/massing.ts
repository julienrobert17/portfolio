import { BoxGeometry, BufferGeometry, Float32BufferAttribute } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { DescripteurCoupe, DescripteurPlan, Projet } from '../content/types'
import { construireMaquette } from './geometrie'
import { EPAISSEUR_DALLE, EPAISSEUR_MUR, MAQUETTE } from './maquette'

/**
 * Volume de masse d'un projet, extrudé de ses descripteurs plan et coupe :
 * emprise, refends en parois fines, niveaux avec leurs dalles, vide
 * traversant (dalles en quatre boîtes, sans CSG), sous-sol enterré, toit plat,
 * à deux pentes ou mono. Une géométrie fusionnée non indexée, faite pour être
 * rendue en fil de fer dans le menu.
 *
 * Tous les massings tiennent dans la même boîte : la plus grande dimension au
 * sol vaut `TAILLE_SOL`, la hauteur suit. Un projet très haut pour son
 * emprise (une petite maison) est réduit pour ne pas dépasser `HAUTEUR_MAX` :
 * sans cela il sortirait du cadre. Centré sur l'origine, sol fini à y = 0.
 * Repère three : X = x du plan, Y = hauteur, Z = y du plan.
 */
const TAILLE_SOL = MAQUETTE.socle.l
const HAUTEUR_MAX = 10
const REFEND = 0.15
const SLUG_MAQUETTE = 'maison-des-vignes'

type Axe = 'x' | 'y'

function boite(x: number, y: number, z: number, l: number, p: number, h: number): BufferGeometry | null {
  if (l <= 0.01 || p <= 0.01 || h <= 0.01) return null
  return new BoxGeometry(l, h, p).translate(x + l / 2, z + h / 2, y + p / 2)
}

/** Dalle de l'emprise à l'altitude `zHaut`, trouée autour du vide s'il existe. */
function dalle(l: number, p: number, zHaut: number, vide?: [number, number, number, number]): Array<BufferGeometry | null> {
  const z0 = zHaut - EPAISSEUR_DALLE
  if (!vide) return [boite(0, 0, z0, l, p, EPAISSEUR_DALLE)]
  const [x0, y0, x1, y1] = vide
  return [
    boite(0, 0, z0, x0, p, EPAISSEUR_DALLE),
    boite(x1, 0, z0, l - x1, p, EPAISSEUR_DALLE),
    boite(x0, 0, z0, x1 - x0, y0, EPAISSEUR_DALLE),
    boite(x0, y1, z0, x1 - x0, p - y1, EPAISSEUR_DALLE),
  ]
}

function murs(l: number, p: number, z0: number, z1: number): Array<BufferGeometry | null> {
  const e = EPAISSEUR_MUR
  const h = z1 - z0
  return [boite(0, 0, z0, l, e, h), boite(0, p - e, z0, l, e, h), boite(0, e, z0, e, p - 2 * e, h), boite(l - e, e, z0, e, p - 2 * e, h)]
}

/**
 * Prisme : un profil convexe dans le plan (u, z), extrudé de v0 à v1 le long
 * de l'autre axe du plan. `axe` est celui que parcourt le profil.
 */
function prisme(profil: [number, number][], v0: number, v1: number, axe: Axe): BufferGeometry {
  const point = (u: number, z: number, v: number): [number, number, number] => (axe === 'x' ? [u, z, v] : [v, z, u])
  const sommets: number[] = []
  const triangle = (a: [number, number, number], b: [number, number, number], c: [number, number, number]) => sommets.push(...a, ...b, ...c)
  const n = profil.length
  for (let i = 1; i < n - 1; i++) {
    triangle(point(...profil[0], v0), point(...profil[i], v0), point(...profil[i + 1], v0))
    triangle(point(...profil[0], v1), point(...profil[i + 1], v1), point(...profil[i], v1))
  }
  for (let i = 0; i < n; i++) {
    const a = profil[i]
    const b = profil[(i + 1) % n]
    triangle(point(...a, v0), point(...a, v1), point(...b, v1))
    triangle(point(...a, v0), point(...b, v1), point(...b, v0))
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new Float32BufferAttribute(sommets, 3))
  geo.computeVertexNormals()
  return geo
}

/** Même règle que le dessin de coupe des fiches (lib/dessins.ts). */
function hauteurDuToit(c: DescripteurCoupe): number {
  if (c.hauteurToit !== undefined) return c.hauteurToit
  if (c.toit === 'plat') return 0
  return c.toit === 'mono' ? Math.min(c.largeur * 0.12, 2.2) : Math.min(c.largeur * 0.28, 4)
}

function toiture(c: DescripteurCoupe, axe: Axe, l: number, p: number, z: number): BufferGeometry[] {
  const portee = axe === 'x' ? l : p
  const longueur = axe === 'x' ? p : l
  const h = hauteurDuToit(c)
  if (c.toit === 'plat' || h <= 0) {
    // Acrotère : un relevé de quarante centimètres sur le pourtour.
    return murs(l, p, z, z + 0.4).filter((g): g is BufferGeometry => g !== null)
  }
  const profil: [number, number][] =
    c.toit === 'mono'
      ? [
          [0, z],
          [portee, z],
          [0, z + h],
        ]
      : [
          [0, z],
          [portee, z],
          [portee / 2, z + h],
        ]
  return [prisme(profil, 0, longueur, axe)]
}

/** La coupe traverse le plan selon sa largeur ou selon sa profondeur : sa propre largeur le dit. */
function axeDeCoupe(plan: DescripteurPlan, coupe: DescripteurCoupe): Axe {
  return Math.abs(coupe.largeur - plan.largeur) <= Math.abs(coupe.largeur - plan.profondeur) ? 'x' : 'y'
}

function fusionner(parties: Array<BufferGeometry | null>): BufferGeometry {
  const presentes = parties.filter((g): g is BufferGeometry => g !== null)
  // Les boîtes sont indexées, les prismes non : on désindexe tout avant de fusionner.
  const plates = presentes.map((g) => (g.index ? g.toNonIndexed() : g))
  // Mêmes attributs partout, sinon la fusion échoue : les boîtes ont des UV, les prismes non.
  plates.forEach((g) => g.deleteAttribute('uv'))
  const geometrie = mergeGeometries(plates, false)
  presentes.forEach((g) => g.dispose())
  plates.forEach((g) => g.dispose())
  if (!geometrie) throw new Error('la-coupe : fusion du massing impossible')
  return geometrie
}

function normaliser(geometrie: BufferGeometry, l: number, p: number, hauteur: number): BufferGeometry {
  const echelle = Math.min(TAILLE_SOL / Math.max(l, p), HAUTEUR_MAX / hauteur)
  return geometrie.translate(-l / 2, 0, -p / 2).scale(echelle, echelle, echelle)
}

const cache = new Map<string, BufferGeometry>()

export function construireMassing(projet: Projet): BufferGeometry | null {
  const connu = cache.get(projet.slug)
  if (connu) return connu

  let geometrie: BufferGeometry
  if (projet.slug === SLUG_MAQUETTE) {
    // Le projet phare a sa maquette détaillée (étage en retrait, escalier) : ses descripteurs en
    // dérivent, pas l'inverse. On la reprend telle quelle.
    const { socle, toit } = MAQUETTE
    geometrie = normaliser(construireMaquette().geometrie, socle.l, socle.p, toit.z + toit.h)
  } else {
    const plan = projet.dessins.find((d): d is DescripteurPlan => d.type === 'plan')
    const coupe = projet.dessins.find((d): d is DescripteurCoupe => d.type === 'coupe')
    if (!plan || !coupe) return null
    const { largeur: l, profondeur: p } = plan
    const axe = axeDeCoupe(plan, coupe)
    const enterre = coupe.enterre ?? 0

    // Vide traversant : donné le long de l'axe de coupe, carré et centré sur l'autre.
    let vide: [number, number, number, number] | undefined
    if (coupe.vide) {
      const [a, b] = coupe.vide
      const autre = axe === 'x' ? p : l
      const cote = Math.min(b - a, autre * 0.6)
      const c0 = (autre - cote) / 2
      vide = axe === 'x' ? [a, c0, b, c0 + cote] : [c0, a, c0 + cote, b]
    }

    const parties: Array<BufferGeometry | null> = []
    if (enterre > 0) parties.push(...murs(l, p, -enterre, 0), ...dalle(l, p, -enterre + EPAISSEUR_DALLE))
    parties.push(...dalle(l, p, 0))
    let z = 0
    coupe.niveaux.forEach((hauteur, i) => {
      const plafond = z + hauteur + EPAISSEUR_DALLE
      const dernier = i === coupe.niveaux.length - 1
      parties.push(...murs(l, p, z, plafond))
      // Le vide troue les planchers intermédiaires, pas la dalle haute qui porte le toit.
      parties.push(...dalle(l, p, plafond, dernier ? undefined : vide))
      for (const [x1, y1, x2, y2] of plan.murs) {
        parties.push(
          x1 === x2
            ? boite(x1 - REFEND / 2, Math.min(y1, y2), z, REFEND, Math.abs(y2 - y1), hauteur)
            : boite(Math.min(x1, x2), y1 - REFEND / 2, z, Math.abs(x2 - x1), REFEND, hauteur),
        )
      }
      z = plafond
    })
    parties.push(...toiture(coupe, axe, l, p, z))
    geometrie = normaliser(fusionner(parties), l, p, z + hauteurDuToit(coupe))
  }
  cache.set(projet.slug, geometrie)
  return geometrie
}
