/**
 * Planches de captures de « Groove To Grave » : chaque page de l'expérience en pleine
 * hauteur, à 1440 px et à 390 px, légendée, une image par format. Chrome (Google Chrome
 * installé sur la machine) en mode headless, pas de Playwright. Le serveur doit tourner
 * (`npm run start` ou `npm run dev`) sur l'URL passée en option.
 *
 *   npx tsx scripts/g2g-planche-captures.ts --phase 2 [--url http://localhost:3000]
 */
import { spawn } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { couleurs } from '../src/components/experience/groove-to-grave/tokens'
import { CACHE, RACINE, dossier } from './g2g-lib'

const DATE = new Date().toISOString().slice(0, 10)
const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const PHASE = arg('--phase', '2')
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const BASE = '/experience/groove-to-grave'
const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']

const PAGES: { chemin: string; titre: string }[] = [
  { chemin: '', titre: 'Accueil' },
  { chemin: '/sorties', titre: 'Sorties' },
  { chemin: '/sorties?genre=break', titre: 'Sorties, filtre break' },
  { chemin: '/sorties/gtgr05', titre: 'Sortie GTGR05' },
  { chemin: '/artistes', titre: 'Artistes' },
  { chemin: '/artistes/kitchen-plug', titre: 'Artiste Kitchen Plug' },
  { chemin: '/soirees', titre: 'Soirées' },
  { chemin: '/label', titre: 'Le label' },
  { chemin: '/contact', titre: 'Contact' },
  { chemin: '/sources', titre: 'Sources et crédits' },
]

const FORMATS = [
  { largeur: 1440, echelle: 1, hauteurMax: 9000 },
  { largeur: 390, echelle: 2, hauteurMax: 16000 },
]

function chrome(): string {
  const c = CHROMES.find((p) => existsSync(p))
  if (!c) throw new Error('Chrome introuvable dans /Applications')
  return c
}

/**
 * Chrome piloté par le protocole DevTools (WebSocket natif de Node, aucune dépendance) :
 * émulation d'appareil à la largeur voulue (Chrome refuse une fenêtre de moins de 500 px),
 * attente du chargement, hauteur réelle du document, capture pleine page.
 */
class Devtools {
  private ws!: WebSocket
  private id = 0
  private attentes = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private evenements = new Set<(methode: string, params: unknown) => void>()
  private processus!: ReturnType<typeof spawn>

  async demarrer(): Promise<void> {
    const port = 9222 + Math.floor(Math.random() * 1000)
    this.processus = spawn(chrome(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(CACHE, 'chrome-profil')}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' })
    let version: { webSocketDebuggerUrl: string } | null = null
    for (let i = 0; i < 50 && !version; i++) {
      try {
        version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()) as { webSocketDebuggerUrl: string }
      } catch {
        await new Promise((r) => setTimeout(r, 200))
      }
    }
    if (!version) throw new Error('Chrome ne répond pas sur le port de débogage')
    this.ws = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise<void>((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve())
      this.ws.addEventListener('error', () => reject(new Error('WebSocket DevTools refusé')))
    })
    this.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(String(ev.data)) as { id?: number; result?: unknown; error?: { message: string }; method?: string; params?: unknown }
      if (m.id !== undefined) {
        const a = this.attentes.get(m.id)
        this.attentes.delete(m.id)
        if (!a) return
        if (m.error) a.reject(new Error(m.error.message))
        else a.resolve(m.result)
      } else if (m.method) {
        for (const fn of this.evenements) fn(m.method, m.params)
      }
    })
  }

  envoyer<T = unknown>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params, sessionId }))
    return new Promise<T>((resolve, reject) => this.attentes.set(id, { resolve: resolve as (v: unknown) => void, reject }))
  }

  attendre(methode: string, delai = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
      const minuteur = setTimeout(() => {
        this.evenements.delete(fn)
        reject(new Error(`${methode} : délai dépassé`))
      }, delai)
      const fn = (m: string) => {
        if (m !== methode) return
        clearTimeout(minuteur)
        this.evenements.delete(fn)
        resolve()
      }
      this.evenements.add(fn)
    })
  }

  async capturer(url: string, largeur: number, echelle: number, hauteurMax: number): Promise<Buffer> {
    const { targetId } = await this.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await this.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
    const s = sessionId
    await this.envoyer('Page.enable', {}, s)
    await this.envoyer('Runtime.enable', {}, s)
    await this.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: 900, deviceScaleFactor: echelle, mobile: largeur < 600 }, s)
    const charge = this.attendre('Page.loadEventFired')
    await this.envoyer('Page.navigate', { url }, s)
    await charge
    // Polices et images visibles, puis une respiration pour les mises en page tardives.
    await this.envoyer('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 400)))', awaitPromise: true }, s)
    const { result } = await this.envoyer<{ result: { value: number } }>('Runtime.evaluate', { expression: 'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)', returnByValue: true }, s)
    const hauteur = Math.min(hauteurMax, Math.ceil(result.value))
    await this.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: echelle, mobile: largeur < 600 }, s)
    await this.envoyer('Runtime.evaluate', { expression: 'new Promise(r => requestAnimationFrame(() => setTimeout(r, 200)))', awaitPromise: true }, s)
    const { data } = await this.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: largeur, height: hauteur, scale: 1 } }, s)
    await this.envoyer('Target.closeTarget', { targetId })
    return Buffer.from(data, 'base64')
  }

  fermer(): void {
    this.ws.close()
    this.processus.kill()
  }
}

async function main(): Promise<void> {
  dossier(join(CACHE, 'chrome-profil'))
  dossier(join(CACHE, 'captures'))
  const navigateur = new Devtools()
  await navigateur.demarrer()
  const PLANCHES = dossier(join(RACINE, 'docs/groove-to-grave/planches'))
  const POLICE = 'Helvetica Neue, Helvetica, Arial, sans-serif'
  for (const f of FORMATS) {
    const captures: { titre: string; buf: Buffer; w: number; h: number }[] = []
    for (const p of PAGES) {
      const buf = await navigateur.capturer(`${URL}${BASE}${p.chemin}`, f.largeur, f.echelle, f.hauteurMax)
      // Capture brute gardée hors dépôt, utile pour la revue page par page.
      writeFileSync(join(CACHE, 'captures', `p${PHASE}-${f.largeur}-${p.chemin.replace(/[^a-z0-9]+/gi, '_') || 'accueil'}.png`), buf)
      const m = await sharp(buf).metadata()
      captures.push({ titre: p.titre, buf, w: m.width ?? 0, h: m.height ?? 0 })
      process.stdout.write(`  ${f.largeur} · ${p.titre} : ${m.width}×${m.height}\n`)
    }
    // Mise en page : à 1440, une capture par ligne ; à 390 (780 px réels), trois par ligne.
    const MARGE = 60
    const colonnes = f.largeur === 390 ? 3 : 1
    const largeurCapture = f.largeur * f.echelle
    const LARGEUR = MARGE * 2 + colonnes * largeurCapture + (colonnes - 1) * 40
    const LEGENDE = 70
    const lignes: { y: number; h: number }[] = []
    let y = 160
    for (let i = 0; i < captures.length; i += colonnes) {
      const h = Math.max(...captures.slice(i, i + colonnes).map((c) => c.h))
      lignes.push({ y, h })
      y += LEGENDE + h + 60
    }
    const HAUTEUR = y
    // Le fond est créé par sharp et les légendes sont de petits SVG : un SVG unique dépasserait la limite de 32767 px.
    const svgTexte = (largeur: number, hauteur: number, s: string, taille: number, gras = false) =>
      Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}"><text x="0" y="${taille}" font-family="${POLICE}" font-size="${taille}" font-weight="${gras ? 700 : 400}" fill="${couleurs.ink}">${s.replace(/&/g, '&amp;')}</text></svg>`)
    const couches: sharp.OverlayOptions[] = [
      { input: svgTexte(LARGEUR - MARGE * 2, 70, `Groove To Grave — Phase ${PHASE} · ${f.largeur} px`, 56, true), left: MARGE, top: 14 },
      { input: svgTexte(LARGEUR - MARGE * 2, 40, `Planche du ${DATE} · pleines hauteurs · ${captures.length} pages · rendu serveur, sans JavaScript requis`, 24), left: MARGE, top: 88 },
    ]
    captures.forEach((c, i) => {
      const ligne = lignes[Math.floor(i / colonnes)]
      const x = MARGE + (i % colonnes) * (largeurCapture + 40)
      couches.push({ input: svgTexte(largeurCapture, 44, `${i + 1}. ${c.titre}`, 30, true), left: x, top: ligne.y + 8 })
      couches.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${c.w + 8}" height="${c.h + 8}"><rect x="2" y="2" width="${c.w + 4}" height="${c.h + 4}" fill="none" stroke="${couleurs.ink}" stroke-width="2"/></svg>`), left: x - 4, top: ligne.y + LEGENDE - 4 })
      couches.push({ input: c.buf, left: x, top: ligne.y + LEGENDE })
    })
    const sortie = join(PLANCHES, `phase-${PHASE}-${f.largeur}-${DATE}.jpg`)
    await sharp({ create: { width: LARGEUR, height: HAUTEUR, channels: 3, background: '#e8e2d4' }, limitInputPixels: false }).composite(couches).jpeg({ quality: 82, mozjpeg: true }).toFile(sortie)
    process.stdout.write(`${sortie.replace(RACINE + '/', '')} (${LARGEUR}×${HAUTEUR})\n`)
  }
  navigateur.fermer()
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
