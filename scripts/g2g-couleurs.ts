/**
 * Couleurs des cassettes : pour chaque sortie, couleur dominante (coque) et couleur
 * d'accent (bande de l'étiquette) extraites de la pochette réelle, image du label si
 * elle est fournie, sinon l'image publique de media/source/. Contraste de `ink`
 * vérifié sur chaque couleur. Écrit content/couleurs.ts (généré).
 *
 *   npx tsx scripts/g2g-couleurs.ts
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { sorties } from '../src/components/experience/groove-to-grave/content/releases'
import type { Couleurs } from '../src/components/experience/groove-to-grave/content/types'
import { INK, LABEL, POSTER, SOURCE, contraste, ecrireModule, hex, lireManifeste, lireSources, rgb } from './g2g-lib'

/** Image de pochette d'une sortie selon la priorité label puis public ; null sinon. */
export function cheminPochette(ref: string): string | null {
  const duLabel = lireManifeste().images.find((i) => i.id === ref)
  if (duLabel && existsSync(join(LABEL, 'images', duLabel.file))) return join(LABEL, 'images', duLabel.file)
  const publique = lireSources().entrees.find((e) => e.id === ref && e.kind === 'pochette')
  if (publique && existsSync(join(SOURCE, publique.file))) return join(SOURCE, publique.file)
  return null
}

// Pas de top-level await : le dépôt compile les scripts en CommonJS (voir fetch-la-coupe-photos.ts).
async function main(): Promise<void> {

  function hsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const R = r / 255
    const G = g / 255
    const B = b / 255
    const max = Math.max(R, G, B)
    const min = Math.min(R, G, B)
    const l = (max + min) / 2
    const d = max - min
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
    let h = 0
    if (d !== 0) {
      if (max === R) h = ((G - B) / d) % 6
      else if (max === G) h = (B - R) / d + 2
      else h = (R - G) / d + 4
      h = (h * 60 + 360) % 360
    }
    return { h, s, l }
  }

  const distance = (a: [number, number, number], b: [number, number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

  /**
   * Dominante et accent lus dans le disque inscrit de l'image (rayon 48 %), jamais dans les
   * coins : les pochettes vinyle publiées par le label sont l'étiquette ronde sur fond noir,
   * et ce fond n'est pas l'œuvre. Les pixels sont réduits à 4 bits par canal sur une vignette
   * de 96 px ; la dominante est le seau le plus peuplé, l'accent le seau le plus saturé et
   * assez éloigné de la dominante, pondéré par sa surface. Une image presque monochrome donne
   * un accent dérivé de la dominante (plus clair ou plus sombre).
   */
  async function extraire(chemin: string): Promise<Couleurs> {
    const TAILLE = 96
    const { data, info } = await sharp(chemin).rotate().resize(TAILLE, TAILLE, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const centre = (TAILLE - 1) / 2
    const rayon = TAILLE * 0.48
    const seaux = new Map<string, { n: number; r: number; g: number; b: number }>()
    for (let y = 0; y < TAILLE; y++) {
      for (let x = 0; x < TAILLE; x++) {
        if (Math.hypot(x - centre, y - centre) > rayon) continue
        const i = (y * TAILLE + x) * info.channels
        const cle = `${data[i] >> 4}-${data[i + 1] >> 4}-${data[i + 2] >> 4}`
        const s = seaux.get(cle) ?? { n: 0, r: 0, g: 0, b: 0 }
        s.n++
        s.r += data[i]
        s.g += data[i + 1]
        s.b += data[i + 2]
        seaux.set(cle, s)
      }
    }
    const moyenne = (s: { n: number; r: number; g: number; b: number }): [number, number, number] => [s.r / s.n, s.g / s.n, s.b / s.n]
    let plusPeuple = { n: 0, r: 0, g: 0, b: 0 }
    for (const s of seaux.values()) if (s.n > plusPeuple.n) plusPeuple = s
    const domRgb = moyenne(plusPeuple)
    const dom = hex(...domRgb)
    let meilleur: { score: number; c: string } | null = null
    for (const s of seaux.values()) {
      const c = moyenne(s)
      const { s: sat, l } = hsl(c[0], c[1], c[2])
      const dist = distance(c, domRgb)
      if (dist < 70 || l < 0.12 || l > 0.9) continue
      const score = Math.sqrt(s.n) * (0.25 + sat) * Math.min(1, dist / 140)
      if (!meilleur || score > meilleur.score) meilleur = { score, c: hex(...c) }
    }
    let accent = meilleur?.c
    if (!accent) {
      const [r, g, b] = rgb(dom)
      const { l } = hsl(r, g, b)
      accent = l > 0.5 ? hex(r * 0.6, g * 0.6, b * 0.6) : hex(r + (255 - r) * 0.5, g + (255 - g) * 0.5, b + (255 - b) * 0.5)
    }
    return {
      dominant: dom,
      accent,
      contrasteInk: { dominant: contraste(INK, dom), accent: contraste(INK, accent) },
      contrastePoster: { dominant: contraste(POSTER, dom), accent: contraste(POSTER, accent) },
    }
  }

  const resultat: Record<string, Couleurs> = {}
  for (const s of sorties) {
    const chemin = cheminPochette(s.ref)
    if (!chemin) {
      process.stdout.write(`  ${s.ref} : pas de pochette, pas de couleurs\n`)
      continue
    }
    const c = await extraire(chemin)
    resultat[s.ref] = c
    const alerte = (v: number) => (v < 3 ? ' → texte en poster' : '')
    process.stdout.write(`  ${s.ref} dominante ${c.dominant} (ink ${c.contrasteInk.dominant}:1${alerte(c.contrasteInk.dominant)}) · accent ${c.accent} (ink ${c.contrasteInk.accent}:1${alerte(c.contrasteInk.accent)})\n`)
  }
  ecrireModule('couleurs.ts', 'Couleurs', 'scripts/g2g-couleurs.ts', 'couleurs', resultat, 'Couleurs extraites des pochettes réelles, par ref de sortie : dominante (coque de la cassette), accent (bande de l\'étiquette), contraste de ink sur chacune.')
  process.stdout.write(`couleurs.ts écrit (${Object.keys(resultat).length} sorties)\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
