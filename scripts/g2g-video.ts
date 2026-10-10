/**
 * Enregistrement d'écran de 30 s avec le son, par format (1440 et 390) : Chrome headless piloté
 * par le protocole DevTools (screencast image par image) pendant que le moteur audio joue, son
 * capturé dans la page par MediaRecorder sur le flux de la sortie générale du moteur
 * (`window.__g2g.flux()`), puis assemblage vidéo et audio par ffmpeg. Aucune dépendance.
 *
 *   npx tsx scripts/g2g-video.ts --phase 3 [--url http://localhost:3000]
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CACHE, RACINE, dossier, ffmpeg } from './g2g-lib'

const DATE = new Date().toISOString().slice(0, 10)
const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const PHASE = arg('--phase', '3')
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const BASE = '/experience/groove-to-grave'
const DUREE_MS = 30000
const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']

interface Scenario {
  largeur: number
  hauteur: number
  echelle: number
  depart: string
  /** Gestes au fil du temps (ms depuis le début) : clic sur un sélecteur, ou navigation par un lien. */
  gestes: { a: number; clic: string }[]
}

const SCENARIOS: Scenario[] = [
  {
    largeur: 1440,
    hauteur: 900,
    echelle: 1,
    depart: '/sorties',
    gestes: [
      { a: 1500, clic: '[data-g2g="ecouter"]' },
      { a: 9000, clic: '[data-g2g="preset-house"]' },
      { a: 14000, clic: '.g2g-lecteur__nav a[href$="/soirees"]' },
      { a: 20000, clic: '[data-g2g="mini"]' },
      { a: 25500, clic: '[data-g2g="lecture-mini"]' },
      { a: 27500, clic: '[data-g2g="lecture-mini"]' },
    ],
  },
  {
    largeur: 390,
    hauteur: 844,
    echelle: 2,
    depart: '/sorties',
    gestes: [
      { a: 1500, clic: '[data-g2g="ecouter"]' },
      { a: 8000, clic: '[data-g2g="deplier"]' },
      { a: 12000, clic: '[data-g2g="preset-electro"]' },
      { a: 16000, clic: '[data-g2g="replier"]' },
      { a: 20000, clic: '[data-g2g="menu"]' },
      { a: 24000, clic: '.g2g-menu__nav a[href$="/soirees"]' },
    ],
  },
]

class Devtools {
  private ws!: WebSocket
  private id = 0
  private attentes = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private evenements = new Set<(methode: string, params: unknown) => void>()
  private processus!: ReturnType<typeof spawn>

  async demarrer(): Promise<void> {
    const chrome = CHROMES.find((p) => existsSync(p))
    if (!chrome) throw new Error('Chrome introuvable')
    const port = 9222 + Math.floor(Math.random() * 1000)
    this.processus = spawn(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${join(CACHE, 'chrome-profil')}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' })
    let version: { webSocketDebuggerUrl: string } | null = null
    for (let i = 0; i < 50 && !version; i++) {
      try {
        version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()) as { webSocketDebuggerUrl: string }
      } catch {
        await new Promise((r) => setTimeout(r, 200))
      }
    }
    if (!version) throw new Error('Chrome ne répond pas')
    this.ws = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise<void>((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve())
      this.ws.addEventListener('error', () => reject(new Error('WebSocket refusé')))
    })
    this.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(String(ev.data)) as { id?: number; result?: unknown; error?: { message: string }; method?: string; params?: unknown }
      if (m.id !== undefined) {
        const a = this.attentes.get(m.id)
        this.attentes.delete(m.id)
        if (!a) return
        if (m.error) a.reject(new Error(m.error.message))
        else a.resolve(m.result)
      } else if (m.method) for (const fn of this.evenements) fn(m.method, m.params)
    })
  }

  envoyer<T = unknown>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params, sessionId }))
    return new Promise<T>((resolve, reject) => this.attentes.set(id, { resolve: resolve as (v: unknown) => void, reject }))
  }

  sur(fn: (methode: string, params: unknown) => void): () => void {
    this.evenements.add(fn)
    return () => this.evenements.delete(fn)
  }

  attendre(methode: string, delai = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
      const minuteur = setTimeout(() => reject(new Error(`${methode} : délai dépassé`)), delai)
      const off = this.sur((m) => {
        if (m !== methode) return
        clearTimeout(minuteur)
        off()
        resolve()
      })
    })
  }

  async cliquer(s: string, selecteur: string): Promise<void> {
    const { result } = await this.envoyer<{ result: { value: { x: number; y: number } | null } }>('Runtime.evaluate', {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(selecteur)}); if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`,
      returnByValue: true,
    }, s)
    if (!result.value) {
      process.stderr.write(`  ${selecteur} introuvable, geste ignoré\n`)
      return
    }
    const { x, y } = result.value
    await this.envoyer('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, s)
    for (const type of ['mousePressed', 'mouseReleased'] as const) await this.envoyer('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }, s)
  }

  fermer(): void {
    this.ws.close()
    this.processus.kill()
  }
}

async function enregistrer(nav: Devtools, sc: Scenario): Promise<string> {
  const dossierFrames = join(CACHE, 'video', `p${PHASE}-${sc.largeur}`)
  mkdirSync(dossierFrames, { recursive: true })
  const { targetId } = await nav.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId: s } = await nav.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
  await nav.envoyer('Page.enable', {}, s)
  await nav.envoyer('Runtime.enable', {}, s)
  await nav.envoyer('Emulation.setDeviceMetricsOverride', { width: sc.largeur, height: sc.hauteur, deviceScaleFactor: sc.echelle, mobile: sc.largeur < 600 }, s)
  const charge = nav.attendre('Page.loadEventFired')
  await nav.envoyer('Page.navigate', { url: `${URL}${BASE}${sc.depart}` }, s)
  await charge
  await nav.envoyer('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 500)))', awaitPromise: true }, s)

  // Son : le premier geste crée le moteur ; on lance l'enregistreur juste après lui.
  const frames: { nom: string; t: number }[] = []
  let compteur = 0
  const off = nav.sur((m, p) => {
    if (m !== 'Page.screencastFrame') return
    const { data, sessionId: sid, metadata } = p as { data: string; sessionId: number; metadata: { timestamp: number } }
    const nom = `f${String(compteur++).padStart(5, '0')}.jpg`
    writeFileSync(join(dossierFrames, nom), Buffer.from(data, 'base64'))
    frames.push({ nom, t: metadata.timestamp })
    void nav.envoyer('Page.screencastFrameAck', { sessionId: sid }, s)
  })
  await nav.envoyer('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: sc.largeur * sc.echelle, maxHeight: sc.hauteur * sc.echelle, everyNthFrame: 1 }, s)
  const debut = Date.now()
  let enregistreurLance = false
  for (const g of sc.gestes) {
    const attente = g.a - (Date.now() - debut)
    if (attente > 0) await new Promise((r) => setTimeout(r, attente))
    await nav.cliquer(s, g.clic)
    if (!enregistreurLance) {
      enregistreurLance = true
      const restant = DUREE_MS - (Date.now() - debut)
      await nav.envoyer('Runtime.evaluate', {
        expression: `(() => { const flux = window.__g2g && window.__g2g.flux(); if (!flux) { window.__g2gAudio = Promise.resolve(null); return 'pas de flux' } const rec = new MediaRecorder(flux, { mimeType: 'audio/webm;codecs=opus' }); const morceaux = []; rec.ondataavailable = (e) => morceaux.push(e.data); window.__g2gAudio = new Promise((resolve) => { rec.onstop = () => { const b = new Blob(morceaux, { type: 'audio/webm' }); const fr = new FileReader(); fr.onload = () => resolve(String(fr.result).split(',')[1]); fr.readAsDataURL(b) } }); rec.start(250); setTimeout(() => rec.stop(), ${restant}); window.__g2gAudioDebut = performance.now(); return 'ok' })()`,
        returnByValue: true,
      }, s)
    }
  }
  const restant = DUREE_MS - (Date.now() - debut)
  if (restant > 0) await new Promise((r) => setTimeout(r, restant))
  await nav.envoyer('Page.stopScreencast', {}, s)
  off()
  const { result } = await nav.envoyer<{ result: { value: string | null } }>('Runtime.evaluate', { expression: 'window.__g2gAudio', awaitPromise: true, returnByValue: true }, s)
  await nav.envoyer('Target.closeTarget', { targetId })

  // Vidéo : liste concat avec la durée réelle de chaque image, 30 s au total.
  const t0 = frames[0]?.t ?? 0
  const lignes: string[] = []
  frames.forEach((f, i) => {
    const suivant = frames[i + 1]?.t ?? t0 + DUREE_MS / 1000
    lignes.push(`file '${f.nom}'`, `duration ${Math.max(0.01, suivant - f.t).toFixed(3)}`)
  })
  if (frames.length) lignes.push(`file '${frames[frames.length - 1].nom}'`)
  writeFileSync(join(dossierFrames, 'liste.txt'), lignes.join('\n') + '\n')
  const video = join(dossierFrames, 'video.mp4')
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', join(dossierFrames, 'liste.txt'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', video])
  const sortie = join(dossier(join(RACINE, 'docs/groove-to-grave/planches')), `phase-${PHASE}-${sc.largeur}-${DATE}.mp4`)
  if (result.value) {
    const audio = join(dossierFrames, 'audio.webm')
    writeFileSync(audio, Buffer.from(result.value, 'base64'))
    // Le son commence au premier geste : décalé d'autant pour rester calé sur l'image.
    const decalage = (sc.gestes[0]?.a ?? 0) / 1000
    ffmpeg(['-i', video, '-itsoffset', String(decalage), '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', sortie])
  } else {
    process.stderr.write('  aucun flux audio capturé : vidéo muette\n')
    ffmpeg(['-i', video, '-c', 'copy', sortie])
  }
  return sortie
}

async function main(): Promise<void> {
  dossier(join(CACHE, 'chrome-profil'))
  const nav = new Devtools()
  await nav.demarrer()
  for (const sc of SCENARIOS) {
    const f = await enregistrer(nav, sc)
    process.stdout.write(`${f.replace(RACINE + '/', '')}\n`)
  }
  nav.fermer()
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
