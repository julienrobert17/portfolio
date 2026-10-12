/**
 * Phase 7.2 : captures du Studio Sanity (local, `sanity dev` sur le port 3333, ou déployé) en
 * Chrome headless à une largeur donnée, en injectant le jeton de session de la CLI Sanity
 * (~/.config/sanity/config.json, jamais dans le dépôt) dans le stockage local du Studio.
 *
 *   npx tsx scripts/g2g-capture-studio.ts --largeur 390 --chemin /structure/sorties --nom studio-390-sorties [--url http://localhost:3333] [--phase 7.2] [--clic "Automatique"]
 * `--clic` clique, une fois la page chargée, le premier bouton ou onglet dont le texte est celui donné (onglet d'un document).
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { Devtools } from './g2g-devtools'
import { RACINE, dossier } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'http://localhost:3333').replace(/\/$/, '')
const LARGEUR = Number(arg('--largeur', '390'))
const CHEMIN = arg('--chemin', '/structure/sorties')
const NOM = arg('--nom', `studio-${LARGEUR}`)
const PROJET = arg('--projet', process.env.SANITY_STUDIO_PROJECT_ID ?? '')
const CLIC = arg('--clic', '')
const SORTIE = dossier(join(RACINE, `docs/groove-to-grave/planches/phase-${arg('--phase', '7.2')}`))

async function main(): Promise<void> {
  const config = JSON.parse(readFileSync(join(homedir(), '.config/sanity/config.json'), 'utf8')) as { authToken?: string }
  if (!config.authToken || !PROJET) throw new Error('jeton Sanity ou identifiant de projet absent')
  const nav = new Devtools()
  await nav.demarrer()
  const mobile = LARGEUR < 600
  const hauteur = mobile ? 844 : 900
  const { targetId } = await nav.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId: s } = await nav.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
  await nav.envoyer('Page.enable', {}, s)
  await nav.envoyer('Runtime.enable', {}, s)
  await nav.envoyer('Emulation.setDeviceMetricsOverride', { width: LARGEUR, height: hauteur, deviceScaleFactor: mobile ? 2 : 1, mobile }, s)
  if (mobile) await nav.envoyer('Emulation.setTouchEmulationEnabled', { enabled: true }, s)
  // Le Studio lit son jeton dans localStorage sous `__studio_auth_token_<projet>`.
  await nav.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('__studio_auth_token_${PROJET}', JSON.stringify({ token: ${JSON.stringify(config.authToken)}, time: new Date().toISOString() }))` }, s)
  const charge = nav.attendre('Page.loadEventFired')
  await nav.envoyer('Page.navigate', { url: `${URL}${CHEMIN}` }, s)
  await charge
  await new Promise((r) => setTimeout(r, 7000))
  if (CLIC) {
    // Vrai clic souris au centre de l'élément : les onglets de Sanity UI réagissent au pointeur, pas à `element.click()`.
    const rect = await nav.evaluer<{ x: number; y: number } | null>(s, `(() => { const b = Array.from(document.querySelectorAll('button, [role="tab"], a')).find((e) => (e.textContent || '').trim() === ${JSON.stringify(CLIC)}); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
    if (!rect) throw new Error(`aucun bouton « ${CLIC} »`)
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'] as const) await nav.envoyer('Input.dispatchMouseEvent', { type, x: rect.x, y: rect.y, button: 'left', clickCount: 1 }, s)
    await new Promise((r) => setTimeout(r, 3000))
  }
  const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
  await nav.envoyer('Target.closeTarget', { targetId })
  nav.fermer()
  const fichier = join(SORTIE, `${NOM}.jpg`)
  await sharp(Buffer.from(data, 'base64')).jpeg({ quality: 88, mozjpeg: true }).toFile(fichier)
  process.stdout.write(`${fichier.replace(RACINE + '/', '')}\n`)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
