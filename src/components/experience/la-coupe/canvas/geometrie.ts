import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Shape } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { projets } from '../content/projets'
import type { Segment } from '../content/types'
import { EPAISSEUR_DALLE, EPAISSEUR_MUR, MAQUETTE, type Volume } from './maquette'
import { projeter } from './projection'

/**
 * Construit la maquette « creuse » à partir des volumes de massing : murs,
 * dalles (trouées autour du vide, en quatre boîtes, sans CSG), refends du
 * plan, toiture à deux pentes avec pignons, deux volées d'escalier. Une
 * seule géométrie fusionnée : trois appels de rendu pour tout le modèle.
 * Repère three : X = x, Y = z (haut), Z = y.
 */
const REFEND = 0.15
const CONTREMARCHE_N = 12

function boite(x: number, y: number, z: number, l: number, p: number, h: number): BufferGeometry {
  return new BoxGeometry(l, h, p).translate(x + l / 2, z + h / 2, y + p / 2)
}

function mursEnveloppe(v: Volume, z0: number, z1: number): BufferGeometry[] {
  const e = EPAISSEUR_MUR
  const h = z1 - z0
  return [
    boite(v.x, v.y, z0, v.l, e, h),
    boite(v.x, v.y + v.p - e, z0, v.l, e, h),
    boite(v.x, v.y + e, z0, e, v.p - 2 * e, h),
    boite(v.x + v.l - e, v.y + e, z0, e, v.p - 2 * e, h),
  ]
}

function dalle(v: Volume, zHaut: number, trou?: Volume): BufferGeometry[] {
  const z0 = zHaut - EPAISSEUR_DALLE
  if (!trou) return [boite(v.x, v.y, z0, v.l, v.p, EPAISSEUR_DALLE)]
  const tx1 = trou.x + trou.l
  const ty1 = trou.y + trou.p
  return [
    boite(v.x, v.y, z0, trou.x - v.x, v.p, EPAISSEUR_DALLE),
    boite(tx1, v.y, z0, v.x + v.l - tx1, v.p, EPAISSEUR_DALLE),
    boite(trou.x, v.y, z0, trou.l, trou.y - v.y, EPAISSEUR_DALLE),
    boite(trou.x, ty1, z0, trou.l, v.y + v.p - ty1, EPAISSEUR_DALLE),
  ]
}

function refends(murs: Segment[], z0: number, z1: number): BufferGeometry[] {
  return murs.map(([x1, y1, x2, y2]) => {
    const vertical = x1 === x2
    return vertical
      ? boite(x1 - REFEND / 2, Math.min(y1, y2), z0, REFEND, Math.abs(y2 - y1), z1 - z0)
      : boite(Math.min(x1, x2), y1 - REFEND / 2, z0, Math.abs(x2 - x1), REFEND, z1 - z0)
  })
}

/** Forme dans le plan (y, z), extrudée le long de x de `x0` à `x1`. */
function extruderLeLongDeX(points: [number, number][], x0: number, x1: number): BufferGeometry {
  const forme = new Shape()
  points.forEach(([y, z], i) => (i === 0 ? forme.moveTo(y, z) : forme.lineTo(y, z)))
  forme.closePath()
  const geo = new ExtrudeGeometry(forme, { depth: x1 - x0, bevelEnabled: false })
  // La forme est en (X, Y) extrudée selon Z ; on la couche : X → Z, extrusion → X.
  return geo.rotateY(-Math.PI / 2).translate(x1, 0, 0)
}

function toiture(t: Volume): BufferGeometry[] {
  const yFaite = t.y + t.p / 2
  const zBas = t.z
  const zFaite = t.z + t.h
  const pente = Math.atan2(t.h, t.p / 2)
  const eV = EPAISSEUR_DALLE / Math.cos(pente)
  const debord = 0.5
  const pan = (yEgout: number): [number, number][] => [
    [yEgout, zBas - (debord * t.h) / (t.p / 2)],
    [yFaite, zFaite],
    [yFaite, zFaite + eV],
    [yEgout, zBas - (debord * t.h) / (t.p / 2) + eV],
  ]
  const pignon: [number, number][] = [
    [t.y, zBas],
    [t.y + t.p, zBas],
    [yFaite, zFaite],
  ]
  return [
    extruderLeLongDeX(pan(t.y - debord), t.x - debord, t.x + t.l + debord),
    extruderLeLongDeX(pan(t.y + t.p + debord), t.x - debord, t.x + t.l + debord),
    extruderLeLongDeX(pignon, t.x, t.x + EPAISSEUR_MUR),
    extruderLeLongDeX(pignon, t.x + t.l - EPAISSEUR_MUR, t.x + t.l),
  ]
}

/** Une volée droite dans la cage : marches pleines empilées, le long de x. */
function volee(cage: Volume, y0: number, largeur: number, z0: number, z1: number, sens: 1 | -1): BufferGeometry[] {
  const giron = cage.l / CONTREMARCHE_N
  const hauteur = (z1 - z0) / CONTREMARCHE_N
  const marches: BufferGeometry[] = []
  for (let i = 0; i < CONTREMARCHE_N; i++) {
    const l = cage.l - i * giron
    const x = sens === 1 ? cage.x + i * giron : cage.x
    marches.push(boite(x, y0, z0, l, largeur, (i + 1) * hauteur))
  }
  return marches
}

export interface MaquetteConstruite {
  geometrie: BufferGeometry
  /** Centre horizontal du modèle, pour la rotation, en repère three (X, Z). */
  centre: [number, number]
  /** Bornes de la projection axonométrique, en mètres écran. */
  bornes: { minX: number; maxX: number; minY: number; maxY: number }
}

export function construireMaquette(): MaquetteConstruite {
  const { socle, etage, toit, vide, escalier } = MAQUETTE
  const plan = projets.find((p) => p.slug === 'maison-des-vignes')?.dessins.find((d) => d.type === 'plan')
  const solSocle = 0
  const plafondSocle = socle.z + socle.h
  const plafondEtage = etage.z + etage.h

  const parties: BufferGeometry[] = [
    ...mursEnveloppe(socle, socle.z, plafondSocle),
    ...dalle(socle, socle.z + EPAISSEUR_DALLE),
    ...dalle(socle, solSocle),
    ...dalle(socle, plafondSocle, vide),
    ...refends(plan?.murs ?? [], solSocle, plafondSocle - EPAISSEUR_DALLE),
    ...mursEnveloppe(etage, etage.z, plafondEtage),
    ...dalle(etage, plafondEtage, vide),
    ...refends([[10, etage.y, 10, etage.y + etage.p]], etage.z, plafondEtage - EPAISSEUR_DALLE),
    ...toiture(toit),
    ...volee(escalier, escalier.y, escalier.p / 2 - 0.1, solSocle, plafondSocle, 1),
    ...volee(escalier, escalier.y + escalier.p / 2 + 0.1, escalier.p / 2 - 0.1, plafondSocle, plafondEtage, -1),
  ]
  const geometrie = mergeGeometries(parties, false)
  parties.forEach((g) => g.dispose())

  const coins: [number, number][] = []
  for (const v of [socle, etage, toit]) {
    for (const dx of [0, v.l]) for (const dy of [0, v.p]) for (const dz of [0, v.h]) coins.push(projeter(v.x + dx, v.y + dy, v.z + dz))
  }
  const bornes = {
    minX: Math.min(...coins.map((c) => c[0])),
    maxX: Math.max(...coins.map((c) => c[0])),
    minY: Math.min(...coins.map((c) => c[1])),
    maxY: Math.max(...coins.map((c) => c[1])),
  }
  return { geometrie, centre: [socle.x + socle.l / 2, socle.y + socle.p / 2], bornes }
}
