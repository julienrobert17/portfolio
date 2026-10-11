/**
 * Planches de captures de « Groove To Grave » : chaque page de l'expérience en pleine
 * hauteur, à 1440 px et à 390 px, légendée, une image par format. Chrome (Google Chrome
 * installé sur la machine) en mode headless par le pilote partagé, pas de Playwright. Le serveur doit tourner
 * (`npm run start` ou `npm run dev`) sur l'URL passée en option.
 *
 *   npx tsx scripts/g2g-planche-captures.ts --phase 2 [--url http://localhost:3000]
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { couleurs } from '../src/components/experience/groove-to-grave/tokens'
import { Devtools } from './g2g-devtools'
import { CACHE, RACINE, dossier } from './g2g-lib'

const DATE = new Date().toISOString().slice(0, 10)
const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const PHASE = arg('--phase', '2')
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const BASE = '/experience/groove-to-grave'

interface Etat {
  chemin: string
  titre: string
  /** Sélecteurs cliqués dans l'ordre (gestes utilisateur par le protocole), avec une pause après chacun. */
  actions?: string[]
  /** Capture de la fenêtre seulement (états du lecteur), pas de la page entière. */
  fenetre?: boolean
  /** Seulement pour ce format. */
  format?: 1440 | 390
  /** Après les gestes : défile jusqu'à cet élément (bas de l'écran), puis attend la sentinelle. */
  defiler?: string
  /** Après les gestes : fige la transition de page (avance rapide du mur et balayage) à cette progression. */
  figer?: number
}

const PAGES: Etat[] = [
  { chemin: '', titre: 'Accueil' },
  { chemin: '/sorties', titre: 'Sorties' },
  { chemin: '/sorties?genre=break', titre: 'Sorties, filtre break' },
  { chemin: '/sorties/gtgr05', titre: 'Sortie GTGR05' },
  { chemin: '/artistes', titre: 'Artistes' },
  { chemin: '/artistes/kitchen-plug', titre: 'Artiste Kitchen Plug' },
  { chemin: '/artistes/lungo', titre: 'Artiste Lungo, invité de compilation' },
  { chemin: '/soirees', titre: 'Soirées' },
  { chemin: '/label', titre: 'Le label' },
  { chemin: '/contact', titre: 'Contact' },
  { chemin: '/sources', titre: 'Sources et crédits' },
]

/** Phase 3 : les états du lecteur, capturés à la taille de la fenêtre après des gestes. */
const ETATS_LECTEUR: Etat[] = [
  { chemin: '/sorties', titre: 'Lecteur à l’arrêt', fenetre: true },
  { chemin: '/sorties', titre: 'Lecteur en lecture', actions: ['[data-g2g="ecouter"]'], fenetre: true },
  { chemin: '/sorties', titre: 'Preset HOUSE en lecture', actions: ['[data-g2g="ecouter"]', '[data-g2g="preset-house"]'], fenetre: true },
  { chemin: '/sorties/gtgr05', titre: 'Page sortie, lecture par piste', actions: ['[data-g2g="ecouter-piste"]'], fenetre: true },
  { chemin: '/sorties', titre: 'Mode mini en lecture', actions: ['[data-g2g="ecouter"]', '[data-g2g="mini"]'], fenetre: true, format: 1440 },
  { chemin: '/sorties', titre: 'Feuille mobile dépliée', actions: ['[data-g2g="ecouter"]', '[data-g2g="deplier"]'], fenetre: true, format: 390 },
  { chemin: '/sorties', titre: 'Menu mobile ouvert', actions: ['[data-g2g="menu"]'], fenetre: true, format: 390 },
  // Phase 5 : l'avance rapide figée à mi-course (bandes de suivi sur le papier, balayage du contenu), la fin de bande.
  { chemin: '/sorties', titre: 'Avance rapide, mi-transition', actions: ['[data-g2g="ecouter"]', '.g2g-lecteur__nav a[href$="/artistes"]'], figer: 0.5, fenetre: true, format: 1440 },
  { chemin: '/sorties', titre: 'Avance rapide, mi-transition', actions: ['[data-g2g="ecouter"]', '[data-g2g="menu"]', '.g2g-menu__nav a[href$="/artistes"]'], figer: 0.5, fenetre: true, format: 390 },
  { chemin: '/sorties', titre: 'Fin de bande dans l’afficheur', actions: ['[data-g2g="ecouter"]'], defiler: '#fin-de-bande', fenetre: true },
]

const FORMATS = [
  { largeur: 1440, echelle: 1, hauteurMax: 9000 },
  { largeur: 390, echelle: 2, hauteurMax: 16000 },
]

/** Pilote partagé (scripts/g2g-devtools.ts, SwiftShader pour WebGL2 : le canvas du mur est bien capturé), plus la capture d'une page. */
class Captures extends Devtools {
  /** Clic par un vrai geste, puis une pause pour les animations. */
  async cliquerEtAttendre(s: string, selecteur: string, pause = 900): Promise<void> {
    await this.cliquer(s, selecteur)
    await new Promise((r) => setTimeout(r, pause))
  }

  async capturer(url: string, largeur: number, echelle: number, hauteurMax: number, actions: string[] = [], fenetre = false, defiler?: string, figer?: number): Promise<Buffer> {
    const { targetId } = await this.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await this.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
    const s = sessionId
    await this.envoyer('Page.enable', {}, s)
    await this.envoyer('Runtime.enable', {}, s)
    const hauteurFenetre = largeur < 600 ? 844 : 900
    await this.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteurFenetre, deviceScaleFactor: echelle, mobile: largeur < 600 }, s)
    const charge = this.attendre('Page.loadEventFired')
    await this.envoyer('Page.navigate', { url }, s)
    await charge
    // Polices et images visibles, puis une respiration pour les mises en page tardives.
    await this.envoyer('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 400)))', awaitPromise: true }, s)
    for (const a of actions) await this.cliquerEtAttendre(s, a)
    if (defiler) {
      await this.envoyer('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(defiler)}).scrollIntoView({ block: 'end', behavior: 'instant' })` }, s)
      await new Promise((r) => setTimeout(r, 900))
    } else if (fenetre) {
      await this.envoyer('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' }, s)
      await new Promise((r) => setTimeout(r, 300))
    }
    if (figer !== undefined) {
      await this.envoyer('Runtime.evaluate', { expression: `window.__g2g && window.__g2g.figerTransition(${figer})` }, s)
      await new Promise((r) => setTimeout(r, 400))
      const { result: mur } = await this.envoyer<{ result: { value: string } }>('Runtime.evaluate', { expression: `(() => { const c = document.querySelector('.g2g-mur-canvas'); return c ? \`canvas prêt ${'$'}{c.hasAttribute('data-pret')}, progression dessinée ${'$'}{c.dataset.avance}\` : 'pas de canvas' })()`, returnByValue: true }, s)
      process.stderr.write(`    transition figée à ${figer} : ${mur.value}\n`)
    }
    const { result } = await this.envoyer<{ result: { value: number } }>('Runtime.evaluate', { expression: 'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)', returnByValue: true }, s)
    const hauteur = fenetre ? hauteurFenetre : Math.min(hauteurMax, Math.ceil(result.value))
    await this.envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: echelle, mobile: largeur < 600 }, s)
    await this.envoyer('Runtime.evaluate', { expression: 'new Promise(r => requestAnimationFrame(() => setTimeout(r, 200)))', awaitPromise: true }, s)
    // États du lecteur : capture de la fenêtre telle quelle (défilement compris, éléments fixes à leur place) ; pages : tout le document.
    const { data } = await this.envoyer<{ data: string }>('Page.captureScreenshot', fenetre ? { format: 'png' } : { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: largeur, height: hauteur, scale: 1 } }, s)
    await this.envoyer('Target.closeTarget', { targetId })
    return Buffer.from(data, 'base64')
  }
}

async function main(): Promise<void> {
  dossier(join(CACHE, 'chrome-profil'))
  dossier(join(CACHE, 'captures'))
  const navigateur = new Captures()
  await navigateur.demarrer()
  const PLANCHES = dossier(join(RACINE, 'docs/groove-to-grave/planches'))
  const POLICE = 'Helvetica Neue, Helvetica, Arial, sans-serif'
  for (const f of FORMATS) {
    const captures: { titre: string; buf: Buffer; w: number; h: number }[] = []
    const liste = (Number(PHASE) >= 3 ? [...PAGES, ...ETATS_LECTEUR] : PAGES).filter((p) => !p.format || p.format === f.largeur)
    // Dossier par format : une image par page et par état, coupée à deux hauteurs d'écran au plus, JPEG 82.
    const dossierFormat = dossier(join(PLANCHES, `phase-${PHASE}-${f.largeur}`))
    const hauteurEcran = (f.largeur < 600 ? 844 : 900) * f.echelle
    let numero = 0
    for (const p of liste) {
      const buf = await navigateur.capturer(`${URL}${BASE}${p.chemin}`, f.largeur, f.echelle, f.hauteurMax, p.actions, p.fenetre, p.defiler, p.figer)
      numero++
      const nom = `${String(numero).padStart(2, '0')}-${p.titre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`
      const meta = await sharp(buf).metadata()
      const hauteurCoupee = Math.min(meta.height ?? 0, hauteurEcran * 2)
      await sharp(buf).extract({ left: 0, top: 0, width: meta.width ?? 0, height: hauteurCoupee }).jpeg({ quality: 82, mozjpeg: true }).toFile(join(dossierFormat, nom))
      // Capture brute gardée hors dépôt, utile pour la revue page par page.
      writeFileSync(join(CACHE, 'captures', `p${PHASE}-${f.largeur}-${p.titre.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`), buf)
      const m = await sharp(buf).metadata()
      captures.push({ titre: p.titre, buf, w: m.width ?? 0, h: m.height ?? 0 })
      process.stdout.write(`  ${f.largeur} · ${nom} : ${m.width}×${m.height}\n`)
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
      { input: svgTexte(LARGEUR - MARGE * 2, 40, `Planche du ${DATE} · ${captures.length} captures · états du lecteur à la fenêtre, pages en pleine hauteur`, 24), left: MARGE, top: 88 },
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
