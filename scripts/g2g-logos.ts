/**
 * Logos provisoires de « Groove To Grave » par vectorisation fidèle, rien de redessiné :
 * recadrage en pleine résolution du monogramme G2G noir de l'étiquette GTGR03 et du crâne
 * coiffé d'un vinyle de l'étiquette GTGR05, seuillage, potrace (outil machine, Homebrew),
 * SVG une couleur en currentColor, nettoyage minimal des nœuds parasites (turdsize) sans
 * modifier les formes. Écrit ui/logos/monogramme.svg, ui/logos/crane.svg, ui/logos/traces.ts,
 * le favicon de l'expérience (src/app/experience/groove-to-grave/icon.svg) et la planche
 * logos. Chaque fichier commence par PLACEHOLDER-TRACE : à remplacer par les fichiers du label.
 *
 *   npx tsx scripts/g2g-logos.ts
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { couleurs } from '../src/components/experience/groove-to-grave/tokens'
import { CACHE, RACINE, SOURCE, dossier, lireSources } from './g2g-lib'

const DATE = new Date().toISOString().slice(0, 10)
const LOGOS = join(RACINE, 'src/components/experience/groove-to-grave/ui/logos')
const PLANCHES = join(RACINE, 'docs/groove-to-grave/planches')

interface Marque {
  nom: 'monogramme' | 'crane'
  titre: string
  /** Ref de la pochette source dans media/source/. */
  ref: string
  credit: string
  crop: { left: number; top: number; width: number; height: number }
  /** Un pixel est encre s'il passe ce test. */
  encre: (r: number, g: number, b: number) => boolean
  /** Ne garder que la composante principale et ce qu'elle enferme (étoiles et rochers voisins écartés). */
  composantePrincipale: boolean
  /** Composantes plus petites que cette fraction de la plus grande : éclats de voisinage, écartés. */
  eclatMinimum: number
  /** turdsize potrace : nœuds parasites de cette taille et moins, en pixels. */
  parasites: number
}

const MARQUES: Marque[] = [
  {
    nom: 'monogramme',
    titre: 'Monogramme G2G',
    ref: 'gtgr03',
    credit: 'étiquette GTGR03, artwork JeunePenard',
    crop: { left: 760, top: 1770, width: 540, height: 860 },
    encre: (r, g, b) => Math.max(r, g, b) < 70,
    composantePrincipale: false,
    eclatMinimum: 0.02,
    parasites: 8,
  },
  {
    nom: 'crane',
    titre: 'Crâne coiffé d’un vinyle',
    ref: 'gtgr05',
    credit: 'étiquette GTGR05, artwork JeunePenard',
    crop: { left: 540, top: 1350, width: 480, height: 540 },
    // Noir des contours et du vinyle, pas le bleu nuit du fond (plus bleu que rouge).
    encre: (r, g, b) => Math.max(r, g, b) < 90 && b - r < 14,
    composantePrincipale: true,
    // Assez bas pour garder le point noir de l'axe au centre du vinyle (une centaine de pixels).
    eclatMinimum: 0.0004,
    parasites: 3,
  },
]

function cheminSource(ref: string): string {
  const e = lireSources().entrees.find((x) => x.id === ref && x.kind === 'pochette')
  if (!e) throw new Error(`${ref} : pochette absente de sources.json, lancer g2g-fetch-media.ts`)
  return join(SOURCE, e.file)
}

/** Masque binaire (1 = encre) et, si demandé, filtrage des composantes étrangères à la marque. */
async function masque(m: Marque): Promise<{ bits: Uint8Array; w: number; h: number }> {
  const { data, info } = await sharp(cheminSource(m.ref)).extract(m.crop).raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const bits = new Uint8Array(w * h)
  for (let i = 0, p = 0; i < data.length; i += info.channels, p++) bits[p] = m.encre(data[i], data[i + 1], data[i + 2]) ? 1 : 0

  // Composantes connexes (4-voisinage) avec leur taille et un pixel représentatif.
  const etiquette = new Int32Array(w * h).fill(-1)
  const tailles: number[] = []
  const pile: number[] = []
  for (let s = 0; s < w * h; s++) {
    if (!bits[s] || etiquette[s] !== -1) continue
    const id = tailles.length
    tailles.push(0)
    pile.push(s)
    etiquette[s] = id
    while (pile.length) {
      const p = pile.pop()!
      const x = p % w
      tailles[id]++
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h) continue
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue
        if (bits[q] && etiquette[q] === -1) {
          etiquette[q] = id
          pile.push(q)
        }
      }
    }
  }
  const plusGrande = Math.max(...tailles)
  const garde = tailles.map((t) => t >= plusGrande * m.eclatMinimum)
  if (m.composantePrincipale) {
    // Extérieur de la silhouette principale : tout ce qu'on atteint depuis le bord sans la traverser.
    const principale = tailles.indexOf(plusGrande)
    const exterieur = new Uint8Array(w * h)
    const file: number[] = []
    const pousser = (p: number) => {
      if (exterieur[p] || (bits[p] && etiquette[p] === principale)) return
      exterieur[p] = 1
      file.push(p)
    }
    for (let x = 0; x < w; x++) {
      pousser(x)
      pousser((h - 1) * w + x)
    }
    for (let y = 0; y < h; y++) {
      pousser(y * w)
      pousser(y * w + w - 1)
    }
    while (file.length) {
      const p = file.pop()!
      const x = p % w
      if (x > 0) pousser(p - 1)
      if (x < w - 1) pousser(p + 1)
      if (p >= w) pousser(p - w)
      if (p + w < w * h) pousser(p + w)
    }
    // Une composante est gardée si elle est la principale ou si elle est enfermée dedans (détails intérieurs).
    const dehors = new Uint8Array(tailles.length)
    for (let s = 0; s < w * h; s++) if (bits[s] && exterieur[s] === 0 && etiquette[s] !== principale) {
      // intérieur : rien à faire
    } else if (bits[s] && etiquette[s] !== principale) dehors[etiquette[s]] = 1
    for (let i = 0; i < tailles.length; i++) if (i !== principale && dehors[i]) garde[i] = false
  }
  for (let s = 0; s < w * h; s++) if (bits[s] && !garde[etiquette[s]]) bits[s] = 0
  return { bits, w, h }
}

/** Recadre le masque sur son contenu avec une marge, et l'écrit en PBM binaire (P4). */
function pbm(bits: Uint8Array, w: number, h: number, chemin: string): { w: number; h: number } {
  let x0 = w
  let y0 = h
  let x1 = 0
  let y1 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (bits[y * w + x]) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  const M = 6
  x0 = Math.max(0, x0 - M)
  y0 = Math.max(0, y0 - M)
  x1 = Math.min(w - 1, x1 + M)
  y1 = Math.min(h - 1, y1 + M)
  const W = x1 - x0 + 1
  const H = y1 - y0 + 1
  const ligne = Math.ceil(W / 8)
  const entete = Buffer.from(`P4\n${W} ${H}\n`)
  const corps = Buffer.alloc(ligne * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bits[(y + y0) * w + (x + x0)]) corps[y * ligne + (x >> 3)] |= 0x80 >> (x & 7)
  writeFileSync(chemin, Buffer.concat([entete, corps]))
  return { w: W, h: H }
}

interface Trace {
  viewBox: string
  transform: string
  d: string
}

/** potrace puis extraction du viewBox, de la transformation et du tracé ; rien d'autre n'est gardé. */
function tracer(entree: string, sortie: string, parasites: number): Trace {
  // -s SVG, --flat : un seul chemin ; -t : nœuds parasites de cette taille et moins ; -a 1 et -O 0.2 : réglages par défaut explicités.
  execFileSync('potrace', ['-s', '--flat', '-t', String(parasites), '-a', '1', '-O', '0.2', '-r', '72', '-o', sortie, entree], { stdio: 'inherit' })
  const svg = readFileSync(sortie, 'utf8')
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1]
  const transform = svg.match(/<g transform="([^"]+)"/)?.[1]
  const d = svg.match(/<path d="([^"]+)"/)?.[1]?.replace(/\s+/g, ' ').trim()
  if (!viewBox || !transform || !d) throw new Error(`${sortie} : sortie potrace inattendue`)
  return { viewBox, transform, d }
}

function svgMarque(t: Trace, fill: string, commentaire?: string): string {
  return `${commentaire ? `<!-- ${commentaire} -->\n` : ''}<svg xmlns="http://www.w3.org/2000/svg" viewBox="${t.viewBox}" fill="${fill}"><g transform="${t.transform}"><path d="${t.d}"/></g></svg>\n`
}

async function main(): Promise<void> {
  dossier(join(CACHE, 'logos'))
  dossier(LOGOS)
  dossier(PLANCHES)
  const traces: Record<string, Trace & { source: string; crop: Marque['crop'] }> = {}
  const apercus: Record<string, { source: Buffer; w: number; h: number }> = {}
  for (const m of MARQUES) {
    const { bits, w, h } = await masque(m)
    const entree = join(CACHE, 'logos', `${m.nom}.pbm`)
    const sortie = join(CACHE, 'logos', `${m.nom}.potrace.svg`)
    const dims = pbm(bits, w, h, entree)
    const t = tracer(entree, sortie, m.parasites)
    const source = `${m.credit} ; recadrage ${m.crop.left},${m.crop.top} ${m.crop.width}×${m.crop.height} px de content/groove-to-grave/media/source/${m.ref}`
    const commentaire = `PLACEHOLDER-TRACE : vectorisation potrace (${DATE}) du ${m.titre.toLowerCase()} relevé sur l'${source}. À remplacer par le fichier du label.`
    writeFileSync(join(LOGOS, `${m.nom}.svg`), svgMarque(t, 'currentColor', commentaire))
    traces[m.nom] = { ...t, source, crop: m.crop }
    apercus[m.nom] = { source: await sharp(cheminSource(m.ref)).extract(m.crop).png().toBuffer(), w: dims.w, h: dims.h }
    process.stdout.write(`  ${m.nom} : ${dims.w}×${dims.h} px → ${t.d.length} caractères de tracé\n`)
  }

  // Module TypeScript pour le rendu en ligne (currentColor par le composant Logo).
  const ts = `/**
 * PLACEHOLDER-TRACE : tracés potrace (${DATE}) du monogramme G2G (étiquette GTGR03) et du crâne
 * coiffé d'un vinyle (étiquette GTGR05), artwork JeunePenard, vectorisés fidèlement sans rien
 * redessiner. À remplacer par les fichiers du label. GÉNÉRÉ par scripts/g2g-logos.ts, ne pas éditer.
 */
export interface Trace {
  viewBox: string
  transform: string
  d: string
}

export const traces = ${JSON.stringify(Object.fromEntries(Object.entries(traces).map(([k, v]) => [k, { viewBox: v.viewBox, transform: v.transform, d: v.d }])), null, 2)} as const satisfies Record<'monogramme' | 'crane', Trace>
`
  writeFileSync(join(LOGOS, 'traces.ts'), ts)

  // Favicon de l'expérience : monogramme ink sur carré red, pris en charge par Next (icon.svg du segment).
  const mono = traces.monogramme
  const [, , vw, vh] = mono.viewBox.split(/\s+/).map(Number)
  const echelle = (64 * 0.72) / Math.max(vw, vh)
  const tx = (64 - vw * echelle) / 2
  const ty = (64 - vh * echelle) / 2
  const favicon = `<!-- PLACEHOLDER-TRACE : favicon dérivé du monogramme tracé (scripts/g2g-logos.ts, ${DATE}), à remplacer par le logo du label. -->
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${couleurs.red}"/><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${echelle.toFixed(5)})" fill="${couleurs.ink}"><g transform="${mono.transform}"><path d="${mono.d}"/></g></g></svg>
`
  writeFileSync(join(RACINE, 'src/app/experience/groove-to-grave/icon.svg'), favicon)

  // ─── Planche logos ───
  const LARGEUR = 2400
  const MARGE = 60
  const H_GRANDE = 760
  const POLICE = 'Helvetica Neue, Helvetica, Arial, sans-serif'
  const texte = (x: number, y: number, s: string, taille: number, gras = false, couleur: string = couleurs.ink) => `<text x="${x}" y="${y}" font-family="${POLICE}" font-size="${taille}" font-weight="${gras ? 700 : 400}" fill="${couleur}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`
  const rendu = async (t: Trace, fill: string, hauteur: number): Promise<{ buf: Buffer; w: number }> => {
    const [, , w, h] = t.viewBox.split(/\s+/).map(Number)
    const largeur = Math.round((hauteur * w) / h)
    const buf = await sharp(Buffer.from(svgMarque(t, fill))).resize(largeur, hauteur).png().toBuffer()
    return { buf, w: largeur }
  }
  const couches: sharp.OverlayOptions[] = []
  let svg = ''
  let y = 150
  svg += texte(MARGE, 70, 'Groove To Grave Records — logos provisoires (PLACEHOLDER-TRACE)', 56, true)
  svg += texte(MARGE, 112, `Planche du ${DATE} · vectorisation potrace fidèle des étiquettes GTGR03 et GTGR05 (artwork JeunePenard), rien de redessiné · à remplacer par les fichiers du label`, 22, false, '#3d3a33')
  for (const m of MARQUES) {
    const t = traces[m.nom]
    svg += texte(MARGE, y + 44, `${m.titre} · source : ${m.credit}`, 40, true)
    const a = apercus[m.nom]
    const src = await sharp(a.source).resize({ height: H_GRANDE, fit: 'inside' }).png().toBuffer()
    const srcMeta = await sharp(src).metadata()
    couches.push({ input: src, left: MARGE, top: y + 70 })
    const tr = await rendu(t, couleurs.ink, H_GRANDE)
    const xTr = MARGE + (srcMeta.width ?? 0) + 80
    svg += `<rect x="${xTr}" y="${y + 70}" width="${tr.w}" height="${H_GRANDE}" fill="${couleurs.poster}"/>`
    couches.push({ input: tr.buf, left: xTr, top: y + 70 })
    svg += texte(MARGE, y + 70 + H_GRANDE + 36, `recadrage source, ${m.crop.width}×${m.crop.height} px`, 22, false, '#3d3a33')
    svg += texte(xTr, y + 70 + H_GRANDE + 36, `tracé, ${a.w}×${a.h} px, currentColor`, 22, false, '#3d3a33')
    // Grille : ink, red, green sur wall puis sur poster.
    const xGrille = xTr + tr.w + 100
    const TUILE = Math.floor((LARGEUR - MARGE - xGrille - 2 * 30) / 3)
    const hTuile = Math.floor((H_GRANDE - 30) / 2)
    const fonds: Array<['wall' | 'poster', number]> = [['wall', 0], ['poster', 1]]
    const encres: Array<'ink' | 'red' | 'green'> = ['ink', 'red', 'green']
    for (const [fond, ligne] of fonds) {
      for (let c = 0; c < encres.length; c++) {
        const x = xGrille + c * (TUILE + 30)
        const yy = y + 70 + ligne * (hTuile + 30)
        svg += `<rect x="${x}" y="${yy}" width="${TUILE}" height="${hTuile}" fill="${couleurs[fond]}" stroke="${couleurs.ink}" stroke-width="2"/>`
        const petit = await rendu(t, couleurs[encres[c]], Math.round(hTuile * 0.72))
        couches.push({ input: petit.buf, left: Math.round(x + (TUILE - petit.w) / 2), top: Math.round(yy + hTuile * 0.1) })
        svg += texte(x + 14, yy + hTuile - 14, `${encres[c]} sur ${fond}`, 20, false, '#3d3a33')
      }
    }
    y += 70 + H_GRANDE + 110
  }
  const hauteur = y + 20
  const fond = `<svg xmlns="http://www.w3.org/2000/svg" width="${LARGEUR}" height="${hauteur}"><rect width="${LARGEUR}" height="${hauteur}" fill="#f4efe2"/>${svg}</svg>`
  const sortie = join(PLANCHES, `logos-${DATE}.jpg`)
  await sharp(Buffer.from(fond)).composite(couches).jpeg({ quality: 88, mozjpeg: true }).toFile(sortie)
  process.stdout.write(`${sortie.replace(RACINE + '/', '')} (${LARGEUR}×${hauteur})\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
