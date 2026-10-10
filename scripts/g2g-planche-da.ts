/**
 * Planche « relevé DA » de « Groove To Grave », une seule image : toutes les pochettes et
 * tous les visuels de soirées récupérés, légendés (référence ou date, source, crédit,
 * dimensions), les deux couleurs extraites en pastilles sous chaque pochette avec leur
 * valeur hexadécimale, et en bas la liste de ce qui manque. Pour la passe d'identité du
 * directeur artistique (brief, Phase 1).
 *
 *   npx tsx scripts/g2g-planche-da.ts   → docs/groove-to-grave/planches/releve-da-<date>.jpg
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { couleurs } from '../src/components/experience/groove-to-grave/content/couleurs'
import { soirees } from '../src/components/experience/groove-to-grave/content/events'
import { sorties } from '../src/components/experience/groove-to-grave/content/releases'
import { LABEL, RACINE, SOURCE, dossier, lireManifeste, lireSources } from './g2g-lib'

// Pas de top-level await : le dépôt compile les scripts en CommonJS (voir fetch-la-coupe-photos.ts).
async function main(): Promise<void> {
  const DATE = new Date().toISOString().slice(0, 10)
  const LARGEUR = 2400
  const MARGE = 60
  const COLONNES = 4
  const CASE = Math.floor((LARGEUR - MARGE * 2 - (COLONNES - 1) * 40) / COLONNES)
  const FOND = '#f4efe2'
  const INK = '#111111'
  const POLICE = 'Helvetica Neue, Helvetica, Arial, sans-serif'

  const manifeste = lireManifeste()
  const sources = lireSources()

  function echapper(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function texte(x: number, y: number, contenu: string, taille: number, options: { gras?: boolean; couleur?: string; mono?: boolean; ancre?: 'start' | 'middle' | 'end' } = {}): string {
    return `<text x="${x}" y="${y}" font-family="${options.mono ? 'Menlo, Courier New, monospace' : POLICE}" font-size="${taille}" font-weight="${options.gras ? 700 : 400}" fill="${options.couleur ?? INK}" text-anchor="${options.ancre ?? 'start'}">${echapper(contenu)}</text>`
  }

  /** Coupe un texte trop long pour la largeur d'une case (approximation : 0,52 em par caractère). */
  function tronquer(s: string, taille: number, largeur = CASE): string {
    const max = Math.floor(largeur / (taille * 0.46))
    return s.length > max ? s.slice(0, max - 1) + '…' : s
  }

  interface Vignette {
    chemin: string | null
    titre: string
    lignes: string[]
    pastilles?: { dominant: string; accent: string }
  }

  function chemin(id: string, kind: 'pochette' | 'flyer'): { chemin: string | null; origine: string; url?: string } {
    const duLabel = manifeste.images.find((i) => i.id === id)
    if (duLabel && existsSync(join(LABEL, 'images', duLabel.file))) return { chemin: join(LABEL, 'images', duLabel.file), origine: 'label' }
    const publique = sources.entrees.find((e) => e.id === id && e.kind === kind)
    if (publique && existsSync(join(SOURCE, publique.file))) return { chemin: join(SOURCE, publique.file), origine: 'public', url: publique.page ?? publique.url }
    return { chemin: null, origine: 'absent' }
  }

  const hote = (url?: string) => (url ? url.replace(/^https?:\/\//, '').split('/')[0] : '—')

  const pochettes: Vignette[] = sorties.map((s) => {
    const c = chemin(s.ref, 'pochette')
    const e = sources.entrees.find((x) => x.id === s.ref)
    return {
      chemin: c.chemin,
      titre: `${s.catalog} · ${s.artistName} — ${s.title}`,
      lignes: [
        `${s.kind === 'vinyle' ? '12″ vinyle' : 'compilation numérique'} · ${s.releaseDate}`,
        `source : ${c.origine === 'label' ? 'fichier du label' : c.origine === 'public' ? hote(c.url) : 'aucune'}${e ? ` · ${e.width}×${e.height} px` : ''}`,
        `artwork : ${s.credits.artwork ?? 'à vérifier'}`,
      ],
      pastilles: couleurs[s.ref],
    }
  })

  const flyers: Vignette[] = soirees.map((ev) => {
    const c = chemin(ev.date, 'flyer')
    const e = sources.entrees.find((x) => x.id === ev.date)
    return {
      chemin: c.chemin,
      titre: `${ev.date}${ev.name ? ` · ${ev.name}` : ''}`,
      lignes: [
        `${ev.venue}${ev.status === 'annulee' ? ' · annulée' : ev.status === 'a-venir' ? ' · à venir' : ''}`,
        `source : ${c.origine === 'label' ? 'fichier du label' : c.origine === 'public' ? hote(c.url) : 'aucune'}${e ? ` · ${e.width}×${e.height} px` : ''}`,
        `visuel : ${ev.flyerCredit ?? 'crédit à vérifier'}`,
      ],
    }
  })

  const manques: string[] = []
  for (const s of sorties) if (!chemin(s.ref, 'pochette').chemin) manques.push(`pochette ${s.catalog}`)
  for (const ev of soirees) if (!chemin(ev.date, 'flyer').chemin) manques.push(`visuel de la soirée du ${ev.date} (${ev.venue})`)
  for (const s of sorties) {
    if (!s.credits.artwork) manques.push(`crédit artwork ${s.catalog}`)
    if (!s.text) manques.push(`texte de sortie ${s.catalog}`)
  }
  manques.push('logo, palette et typographies réelles du label', 'photos du crew et des artistes', 'adresse de contact et de démos', 'vrais extraits audio (accord du label)')
  for (const e of sources.echecs) if (!manques.some((m) => m.includes(e.id))) manques.push(`${e.id} : ${e.raison}`)

  const HAUTEUR_LEGENDE = 150
  const HAUTEUR_PASTILLES = 70

  async function section(titre: string, vignettes: Vignette[], pastilles: boolean, hauteurImage = CASE): Promise<{ hauteur: number; svg: string; images: sharp.OverlayOptions[]; decalage: (dy: number) => void }> {
    const images: sharp.OverlayOptions[] = []
    const bas = HAUTEUR_LEGENDE + (pastilles ? HAUTEUR_PASTILLES : 0)
    const hauteurCase = hauteurImage + bas
    const lignes = Math.ceil(vignettes.length / COLONNES)
    const hauteur = 90 + lignes * (hauteurCase + 40)
    let svg = texte(MARGE, 56, titre, 44, { gras: true })
    const positions: { x: number; y: number }[] = []
    for (let i = 0; i < vignettes.length; i++) {
      const v = vignettes[i]
      const x = MARGE + (i % COLONNES) * (CASE + 40)
      const y = 90 + Math.floor(i / COLONNES) * (hauteurCase + 40)
      positions.push({ x, y })
      if (v.chemin) {
        const img = await sharp(readFileSync(v.chemin)).rotate().resize(CASE, hauteurImage, { fit: 'contain', background: FOND }).png().toBuffer()
        images.push({ input: img, left: x, top: y })
      } else {
        svg += `<rect x="${x}" y="${y}" width="${CASE}" height="${hauteurImage}" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="14 10"/>` + texte(x + CASE / 2, y + hauteurImage / 2, 'visuel manquant', 30, { ancre: 'middle', couleur: '#6b6557' })
      }
      svg += texte(x, y + hauteurImage + 40, tronquer(v.titre, 24), 24, { gras: true })
      v.lignes.forEach((l, j) => {
        svg += texte(x, y + hauteurImage + 76 + j * 30, tronquer(l, 21), 21, { couleur: '#3d3a33' })
      })
      if (pastilles && v.pastilles) {
        const py = y + hauteurImage + HAUTEUR_LEGENDE + 8
        svg += `<rect x="${x}" y="${py}" width="56" height="40" rx="6" fill="${v.pastilles.dominant}" stroke="${INK}" stroke-width="2"/>` + texte(x + 68, py + 28, v.pastilles.dominant, 22, { mono: true })
        svg += `<rect x="${x + CASE / 2}" y="${py}" width="56" height="40" rx="6" fill="${v.pastilles.accent}" stroke="${INK}" stroke-width="2"/>` + texte(x + CASE / 2 + 68, py + 28, v.pastilles.accent, 22, { mono: true })
      }
    }
    return {
      hauteur,
      svg,
      images,
      decalage: (dy) => {
        for (const im of images) im.top = (im.top ?? 0) + dy
      },
    }
  }

  const entete = 150
  const s1 = await section(`Pochettes (${pochettes.filter((p) => p.chemin).length}/${pochettes.length})`, pochettes, true)
  // Les visuels de billetterie sont presque tous en 1200×630 : cases moins hautes.
  const s2 = await section(`Visuels de soirées (${flyers.filter((f) => f.chemin).length}/${flyers.length})`, flyers, false, Math.round(CASE * 0.6))
  const hauteurManques = 100 + manques.length * 34 + 60
  const hauteurTotale = entete + s1.hauteur + s2.hauteur + hauteurManques

  s1.decalage(entete)
  s2.decalage(entete + s1.hauteur)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${hauteurTotale}" viewBox="0 0 ${LARGEUR} ${hauteurTotale}"><rect width="${LARGEUR}" height="${hauteurTotale}" fill="${FOND}"/>`
  svg += texte(MARGE, 70, 'Groove To Grave Records — relevé DA', 56, { gras: true })
  svg += texte(MARGE, 112, `Planche du ${DATE} · site concept non officiel · œuvres affichées intactes, créditées, jamais recadrées · pochettes : couleur dominante (coque) et accent (bande) extraits par scripts/g2g-couleurs.ts`, 22, { couleur: '#3d3a33' })
  svg += `<g transform="translate(0 ${entete})">${s1.svg}</g>`
  svg += `<g transform="translate(0 ${entete + s1.hauteur})">${s2.svg}</g>`
  const yM = entete + s1.hauteur + s2.hauteur
  svg += `<g transform="translate(0 ${yM})">` + texte(MARGE, 56, `Ce qui manque (${manques.length})`, 44, { gras: true })
  manques.forEach((m, i) => {
    svg += texte(MARGE, 110 + i * 34, tronquer(`— ${m}`, 24, LARGEUR - MARGE * 2), 24)
  })
  svg += '</g></svg>'

  const sortie = join(dossier(join(RACINE, 'docs/groove-to-grave/planches')), `releve-da-${DATE}.jpg`)
  await sharp(Buffer.from(svg))
    .composite([...s1.images, ...s2.images])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(sortie)
  process.stdout.write(`${sortie.replace(RACINE + '/', '')} (${LARGEUR}×${hauteurTotale})\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
