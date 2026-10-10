/**
 * Chrome piloté par le protocole DevTools, sans dépendance : WebSocket natif de Node, Chrome
 * installé sur la machine. Partagé par les scripts de captures, de vidéo et de mesures audio.
 * Chrome headless refuse une fenêtre de moins de 500 px : l'émulation d'appareil fait la taille.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CACHE } from './g2g-lib'

const CHROMES = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']

export class Devtools {
  private ws!: WebSocket
  private id = 0
  private attentes = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
  private evenements = new Set<(methode: string, params: unknown) => void>()
  private processus!: ReturnType<typeof spawn>

  async demarrer(): Promise<void> {
    const chrome = CHROMES.find((p) => existsSync(p))
    if (!chrome) throw new Error('Chrome introuvable dans /Applications')
    const port = 9222 + Math.floor(Math.random() * 1000)
    this.processus = spawn(chrome, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run', '--autoplay-policy=no-user-gesture-required', `--user-data-dir=${join(CACHE, 'chrome-profil')}`, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' })
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

  /** Nouvelle page émulée à la taille voulue, chargée et polices prêtes ; retourne l'identifiant de session et de cible. */
  async page(url: string, largeur: number, hauteur: number, echelle: number): Promise<{ s: string; targetId: string }> {
    const { targetId } = await this.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
    const { sessionId: s } = await this.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
    await this.envoyer('Page.enable', {}, s)
    await this.envoyer('Runtime.enable', {}, s)
    await this.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: echelle, mobile: largeur < 600 }, s)
    const charge = this.attendre('Page.loadEventFired')
    await this.envoyer('Page.navigate', { url }, s)
    await charge
    await this.envoyer('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 500)))', awaitPromise: true }, s)
    return { s, targetId }
  }

  /** Évalue une expression dans la page et retourne sa valeur (promesses attendues). */
  async evaluer<T>(s: string, expression: string): Promise<T> {
    const { result } = await this.envoyer<{ result: { value: T } }>('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, s)
    return result.value
  }

  /** Enregistre le son du moteur pendant `ms` millisecondes (MediaRecorder sur window.__g2g.flux()) et retourne le webm en base64, ou null. */
  async enregistrerSon(s: string, ms: number): Promise<string | null> {
    return this.evaluer<string | null>(s, `(() => new Promise((resolve) => { const flux = window.__g2g && window.__g2g.flux(); if (!flux) return resolve(null); const rec = new MediaRecorder(flux, { mimeType: 'audio/webm;codecs=opus' }); const morceaux = []; rec.ondataavailable = (e) => morceaux.push(e.data); rec.onstop = () => { const b = new Blob(morceaux, { type: 'audio/webm' }); const fr = new FileReader(); fr.onload = () => resolve(String(fr.result).split(',')[1]); fr.readAsDataURL(b) }; rec.start(250); setTimeout(() => rec.stop(), ${ms}) }))()`)
  }
}
