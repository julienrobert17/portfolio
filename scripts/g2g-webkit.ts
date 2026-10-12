/**
 * Contrôle WebKit ponctuel (bloc 7.5a). Notre automatisation ordinaire (`g2g-verif`, `g2g-a11y`,
 * planches, vidéos, Lighthouse) ne tourne que dans Chromium : elle ne dit rien de Safari ni d'iOS,
 * où le lecteur a été trouvé muet. Ce script ouvre les pages dans **WebKit**, clique sur un bouton
 * écouter, et rend compte de ce que fait réellement l'élément audio.
 *
 * Il n'ajoute **aucune dépendance au dépôt** : Playwright est cherché dans un dossier hors dépôt,
 * à installer une fois à la main (environ 300 Mo, rien dans le projet) :
 *
 *   mkdir -p ~/.cache/g2g-webkit && cd ~/.cache/g2g-webkit && npm i playwright
 *   npx --prefix ~/.cache/g2g-webkit playwright install webkit
 *
 * puis, depuis la racine du worktree :
 *
 *   npx tsx scripts/g2g-webkit.ts [--url https://portfolio-eight-sable-66.vercel.app] [--appareil "iPhone 13"]
 *
 * Sur la machine de développement du 12 octobre 2026 (macOS 14, Playwright 1.64, build
 * webkit_mac14_arm64_special-2251), le navigateur se lance mais **n'ouvre aucune page** : le script
 * le dit et sort en erreur au lieu de rester bloqué. Un iPhone réel reste donc l'épreuve de vérité,
 * et `public/experience/groove-to-grave/diagnostic.html` est là pour ça.
 */
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL_SITE = arg('--url', 'https://portfolio-eight-sable-66.vercel.app').replace(/\/$/, '')
const APPAREIL = arg('--appareil', 'iPhone 13')
const BASE = '/experience/groove-to-grave'
const DOSSIER = join(homedir(), '.cache/g2g-webkit/node_modules/playwright')
const DELAI_PAGE = 20000

interface Etat {
  joue: boolean
  resume: string
}

/**
 * Le strict nécessaire de l'API Playwright, décrit ici : le paquet vit hors du dépôt, ses types ne
 * sont donc pas installés, et nous ne voulons pas d'`any`.
 */
interface Requete {
  url(): string
  failure(): { errorText: string } | null
}
interface Message {
  type(): string
  text(): string
}
interface PageWebkit {
  on(evenement: 'pageerror', f: (e: unknown) => void): void
  on(evenement: 'console', f: (m: Message) => void): void
  on(evenement: 'requestfailed', f: (r: Requete) => void): void
  goto(url: string, options: { waitUntil: 'domcontentloaded'; timeout: number }): Promise<unknown>
  waitForTimeout(ms: number): Promise<void>
  locator(selecteur: string): { first(): { click(): Promise<void> } }
  evaluate<T>(expression: string): Promise<T>
}
interface ContexteWebkit {
  newPage(): Promise<PageWebkit>
}
interface NavigateurWebkit {
  newContext(options: Record<string, unknown>): Promise<ContexteWebkit>
  close(): Promise<void>
}
interface Playwright {
  webkit: { launch(): Promise<NavigateurWebkit> }
  devices: Record<string, Record<string, unknown>>
}

/** Rend une promesse qui échoue si l'opération dépasse `ms` : WebKit peut rester sans répondre. */
function avecDelai<T>(promesse: Promise<T>, ms: number, quoi: string): Promise<T> {
  return Promise.race([promesse, new Promise<T>((_, rejeter) => setTimeout(() => rejeter(new Error(`${quoi} : aucune réponse en ${ms / 1000} s`)), ms))])
}

async function main(): Promise<void> {
  const require = createRequire(import.meta.url)
  let playwright: Playwright
  try {
    playwright = require(DOSSIER) as Playwright
  } catch {
    throw new Error(`Playwright absent de ${DOSSIER}. Installe-le hors du dépôt :\n  mkdir -p ~/.cache/g2g-webkit && cd ~/.cache/g2g-webkit && npm i playwright\n  npx --prefix ~/.cache/g2g-webkit playwright install webkit`)
  }
  const { webkit, devices } = playwright
  const navigateur = await avecDelai(webkit.launch(), DELAI_PAGE, 'lancement de WebKit')
  const contexte = await navigateur.newContext({ ...devices[APPAREIL] })
  const page = await avecDelai(contexte.newPage(), DELAI_PAGE, 'ouverture d’une page WebKit')
  const erreurs: string[] = []
  page.on('pageerror', (e) => erreurs.push(String(e).slice(0, 160)))
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text().slice(0, 160))
  })
  page.on('requestfailed', (r) => erreurs.push(`${r.url().split('/').pop()} : ${r.failure()?.errorText}`))

  await page.goto(`${URL_SITE}${BASE}/sorties`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2500)
  await page.locator('[data-g2g="ecouter"]').first().click()
  await page.waitForTimeout(5000)
  const etat = await page.evaluate<Etat>(`(() => {
    const a = document.querySelector('audio');
    const g = window.__g2g || {};
    const e = a && a.error ? 'erreur ' + a.error.code + ' ' + (a.error.message || '') : 'pas d’erreur';
    const echec = document.querySelector('[data-g2g="echec"]');
    return {
      joue: !!a && a.currentTime > 0.1,
      resume: 'temps ' + (a ? a.currentTime.toFixed(2) : '?') + ' s · réseau ' + (a ? a.networkState : '?') + ' · prêt ' + (a ? a.readyState : '?') + ' · ' + e
        + ' · contexte ' + (g.etatAudio ? g.etatAudio() : '?') + ' · statut ' + (document.querySelector('.g2g-lecteur') || { dataset: {} }).dataset.statut
        + (echec ? ' · message d’échec affiché' : ''),
    };
  })()`)
  process.stdout.write(`${APPAREIL} · ${URL_SITE}\n  ${etat.joue ? 'JOUE' : 'NE JOUE PAS'} · ${etat.resume}\n`)
  if (erreurs.length) process.stdout.write(`  erreurs : ${erreurs.slice(0, 5).join(' | ')}\n`)
  await navigateur.close()
  if (!etat.joue) process.exit(1)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`)
  process.exit(1)
})
