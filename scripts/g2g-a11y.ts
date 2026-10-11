/**
 * Accessibilité et replis de « Groove To Grave », dans Chrome headless (pilote partagé) :
 *   - axe-core (paquet npm extrait dans le cache, hors dépôt : `npm pack axe-core`) sur les onze
 *     pages aux deux formats, plus la feuille et le menu ouverts sur mobile et la lecture sur
 *     desktop : zéro violation exigée ;
 *   - parcours au clavier : lien d'évitement, ordre de tabulation (skin puis contenu), focus
 *     visible, rien de masqué sous le skin au focus, menu et feuille sans piège, Échap qui ferme
 *     et rend le focus au bouton d'origine ;
 *   - annonces aria-live du lecteur ;
 *   - mouvement réduit, sans JavaScript et sans WebGL, page par page.
 * Le serveur doit tourner (`next start`). Sort une table Markdown et un code de retour.
 *
 *   npx tsx scripts/g2g-a11y.ts [--url http://localhost:3000]
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Devtools } from './g2g-devtools'
import { CACHE } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'http://localhost:3000').replace(/\/$/, '')
const BASE = '/experience/groove-to-grave'
const PAGES = ['', '/sorties', '/sorties/gtgr05', '/sorties/gtgrva02', '/artistes', '/artistes/kitchen-plug', '/artistes/lungo', '/soirees', '/label', '/contact', '/sources']
const FORMATS = [
  { largeur: 1440, hauteur: 900, echelle: 1 },
  { largeur: 390, hauteur: 844, echelle: 2 },
]
const AXE = join(CACHE, 'outils/package/axe.min.js')

interface Resultat {
  format: number
  page: string
  controle: string
  ok: boolean
  detail: string
}
const resultats: Resultat[] = []
const noter = (format: number, page: string, controle: string, ok: boolean, detail = '') => {
  resultats.push({ format, page: page || '/', controle, ok, detail })
  process.stderr.write(`  ${ok ? 'ok' : 'KO'} ${format} ${page || '/'} · ${controle}${detail ? ` · ${detail}` : ''}\n`)
}
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Violation {
  id: string
  impact: string
  nodes: { target: string[] }[]
}

async function axe(nav: Devtools, s: string, source: string): Promise<Violation[]> {
  await nav.envoyer('Runtime.evaluate', { expression: source }, s)
  return nav.evaluer<Violation[]>(s, `axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target })) })))`)
}

const resume = (v: Violation[]) => v.map((x) => `${x.id} (${x.impact}, ${x.nodes.length}) ${x.nodes[0]?.target.join(' ')}`).join(' ; ')

async function touche(nav: Devtools, s: string, key: string, code: string, keyCode: number, modifiers = 0): Promise<void> {
  // Entrée doit porter son caractère pour activer un bouton ou un lien.
  await nav.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, modifiers, ...(key === 'Enter' ? { text: '\r' } : {}) }, s)
  await nav.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, modifiers }, s)
  await attendre(60)
}
const tab = (nav: Devtools, s: string, arriere = false) => touche(nav, s, 'Tab', 'Tab', 9, arriere ? 8 : 0)
const entree = (nav: Devtools, s: string) => touche(nav, s, 'Enter', 'Enter', 13)
const echap = (nav: Devtools, s: string) => touche(nav, s, 'Escape', 'Escape', 27)

/** Description de l'élément focalisé : sélecteur court, zone (skin, contenu, pied), focus visible, position par rapport au skin. */
const FOCUS = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { sel: 'body', zone: 'body', visible: false, sousSkin: false };
  const cs = getComputedStyle(el);
  // Les curseurs portent leur anneau de focus sur le pouce (::-webkit-slider-thumb), pas sur l'input.
  const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || el.matches('.g2g-curseur');
  const r = el.getBoundingClientRect();
  const skin = document.querySelector('.g2g-lecteur').getBoundingClientRect();
  const dansSkin = !!el.closest('.g2g-lecteur');
  const zone = el.matches('.g2g-skip') ? 'skip' : dansSkin ? (el.closest('.g2g-menu') ? 'menu' : el.closest('.g2g-feuille') ? 'feuille' : el.closest('.g2g-barre') ? 'barre' : 'skin') : el.closest('#contenu') ? 'contenu' : el.closest('.g2g-fin') ? 'pied' : 'autre';
  const sousSkin = !dansSkin && zone !== 'skip' && r.height > 0 && r.top < skin.bottom - 1 && r.bottom > skin.top;
  const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.dataset.g2g ? '[' + el.dataset.g2g + ']' : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
  return { sel, zone, visible, sousSkin, texte: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) };
})()`
interface Focus {
  sel: string
  zone: string
  visible: boolean
  sousSkin: boolean
  texte?: string
}

async function clavier(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const mobile = f.largeur < 600
  const { s, targetId } = await nav.page(`${URL}${BASE}/sorties`, f.largeur, f.hauteur, f.echelle)
  await nav.envoyer('Emulation.setFocusEmulationEnabled', { enabled: true }, s)
  // Lien d'évitement en premier, puis le contenu.
  await tab(nav, s)
  const premier = await nav.evaluer<Focus>(s, FOCUS)
  noter(f.largeur, '/sorties', 'premier Tab : lien d’évitement, focus visible', premier.zone === 'skip' && premier.visible, premier.sel)
  await entree(nav, s)
  await attendre(300)
  await tab(nav, s)
  const apresSkip = await nav.evaluer<Focus>(s, FOCUS)
  noter(f.largeur, '/sorties', 'après le lien d’évitement : focus dans le contenu, pas sous le skin', apresSkip.zone === 'contenu' && !apresSkip.sousSkin && apresSkip.visible, `${apresSkip.sel} ${apresSkip.texte ?? ''}`)
  // Ordre : depuis le début, le skin vient avant le contenu, le focus est toujours visible, jamais sous le skin.
  // Point de départ : la racine (tabindex -1), juste avant le lien d'évitement.
  await nav.evaluer(s, `window.scrollTo(0, 0); document.getElementById('haut').focus({ preventScroll: true })`)
  const zones: string[] = []
  const problemes: string[] = []
  let dernierSkin = -1
  let premierContenu = -1
  for (let i = 0; i < 60; i++) {
    await tab(nav, s)
    const fo = await nav.evaluer<Focus>(s, FOCUS)
    zones.push(fo.zone)
    if (fo.zone === 'skin' || fo.zone === 'barre') dernierSkin = i
    if (fo.zone === 'contenu' && premierContenu < 0) premierContenu = i
    if (fo.zone !== 'body' && fo.zone !== 'skip' && !fo.visible) problemes.push(`focus invisible sur ${fo.sel}`)
    if (fo.sousSkin) problemes.push(`${fo.sel} sous le skin`)
    if (fo.zone === 'pied') break
  }
  noter(f.largeur, '/sorties', 'ordre de tabulation : skin, puis contenu, puis pied ; focus visible ; rien sous le skin', premierContenu > dernierSkin && dernierSkin >= 0 && problemes.length === 0, problemes.slice(0, 3).join(' ; ') || `${zones.filter((z) => z === 'skin' || z === 'barre').length} dans le skin, contenu à partir de ${premierContenu + 1}`)
  // Panneaux : menu (mobile) et feuille (mobile) sans piège, Échap ferme et rend le focus.
  if (mobile) {
    for (const [bouton, panneau] of [['menu', 'menu'], ['deplier', 'feuille']] as const) {
      await nav.evaluer(s, `document.querySelector('[data-g2g="${bouton}"]').focus()`)
      await entree(nav, s)
      await attendre(400)
      const dedans = await nav.evaluer<Focus>(s, FOCUS)
      const parcours: string[] = []
      for (let i = 0; i < 14; i++) {
        await tab(nav, s)
        parcours.push((await nav.evaluer<Focus>(s, FOCUS)).zone)
      }
      // Le contenu et le pied sont inertes ; le cycle peut passer par le début du document (body, lien d'évitement), ce n'est pas un piège.
      const horsPanneau = parcours.filter((z) => z === 'contenu' || z === 'pied').length
      await echap(nav, s)
      await attendre(400)
      const apres = await nav.evaluer<{ ouvert: boolean; focus: Focus }>(s, `({ ouvert: !document.querySelector('.g2g-${panneau}').hidden, focus: ${FOCUS} })`)
      noter(f.largeur, '/sorties', `${panneau} : focus dedans à l’ouverture, Tab reste dans le skin et le panneau, Échap ferme et rend le focus au bouton`, dedans.zone === panneau && horsPanneau === 0 && !apres.ouvert && apres.focus.sel.includes(`[${bouton}]`), `${dedans.sel} → ${parcours.join(',')} → ${apres.focus.sel}`)
    }
  }
  // Annonces aria-live.
  await nav.evaluer(s, `document.querySelector('[data-g2g="ecouter"]').click()`)
  await attendre(600)
  const annonce1 = await nav.evaluer<string>(s, `document.querySelector('.g2g-lecteur [aria-live]').textContent`)
  await nav.evaluer(s, `document.querySelector('[data-g2g="preset-house"]').click()`)
  await attendre(400)
  const annonce2 = await nav.evaluer<string>(s, `document.querySelector('.g2g-lecteur [aria-live]').textContent`)
  noter(f.largeur, '/sorties', 'annonces aria-live : lecture puis preset', /Lecture/.test(annonce1) && /sorties pour house/.test(annonce2), `« ${annonce1.slice(0, 40)} » puis « ${annonce2.slice(0, 40)} »`)
  await nav.envoyer('Target.closeTarget', { targetId })
}

async function pagesAxe(nav: Devtools, f: (typeof FORMATS)[number], source: string): Promise<void> {
  const mobile = f.largeur < 600
  for (const chemin of PAGES) {
    const { s, targetId } = await nav.page(`${URL}${BASE}${chemin}`, f.largeur, f.hauteur, f.echelle)
    const v = await axe(nav, s, source)
    noter(f.largeur, chemin, 'axe-core : zéro violation', v.length === 0, resume(v))
    if (chemin === '/sorties') {
      // États du lecteur : en lecture (desktop), feuille puis menu ouverts (mobile).
      await nav.evaluer(s, `document.querySelector('[data-g2g="ecouter"]').click()`)
      await attendre(500)
      const vl = await axe(nav, s, source)
      noter(f.largeur, chemin, 'axe-core en lecture : zéro violation', vl.length === 0, resume(vl))
      if (mobile) {
        await nav.evaluer(s, `document.querySelector('[data-g2g="deplier"]').click()`)
        await attendre(400)
        const vf = await axe(nav, s, source)
        noter(f.largeur, chemin, 'axe-core, feuille ouverte : zéro violation', vf.length === 0, resume(vf))
        await nav.evaluer(s, `document.querySelector('[data-g2g="replier"]').click(); setTimeout(() => document.querySelector('[data-g2g="menu"]').click(), 200)`)
        await attendre(600)
        const vm = await axe(nav, s, source)
        noter(f.largeur, chemin, 'axe-core, menu ouvert : zéro violation', vm.length === 0, resume(vm))
      }
    }
    await nav.envoyer('Target.closeTarget', { targetId })
  }
}

/** Replis : mouvement réduit, sans JavaScript, sans WebGL, sur chaque page. */
async function replis(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  for (const mode of ['reduit', 'sans-js', 'sans-webgl'] as const) {
    const problemes: string[] = []
    for (const chemin of PAGES) {
      const { targetId } = await nav.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
      const { sessionId: s } = await nav.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
      await nav.envoyer('Page.enable', {}, s)
      await nav.envoyer('Runtime.enable', {}, s)
      const erreurs: string[] = []
      const off = nav.sur((m, p) => {
        if (m === 'Runtime.exceptionThrown') erreurs.push(String((p as { exceptionDetails: { text: string; exception?: { description?: string } } }).exceptionDetails.exception?.description ?? '').slice(0, 80))
      })
      await nav.envoyer('Emulation.setDeviceMetricsOverride', { width: f.largeur, height: f.hauteur, deviceScaleFactor: f.echelle, mobile: f.largeur < 600 }, s)
      if (mode === 'reduit') await nav.envoyer('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, s)
      if (mode === 'sans-js') await nav.envoyer('Emulation.setScriptExecutionDisabled', { value: true }, s)
      if (mode === 'sans-webgl') await nav.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: `const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a) }` }, s)
      const charge = nav.attendre('Page.loadEventFired')
      await nav.envoyer('Page.navigate', { url: `${URL}${BASE}${chemin}` }, s)
      await charge
      await attendre(mode === 'sans-webgl' ? 3200 : 900)
      const etat = await nav.evaluer<{ contenu: boolean; pied: boolean; js: boolean; statique: string; lecteur: string; canvas: boolean; fond: boolean; bandeAnimee: boolean; collageCache: number; filtres: number }>(s, `(() => {
        const racine = document.querySelector('.g2g');
        const cs = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).display : 'absent' };
        const bande = document.querySelector('.g2g-bande__piste');
        return {
          contenu: !!document.querySelector('#contenu') && document.querySelector('#contenu').children.length > 0,
          pied: !!document.querySelector('.g2g-fin'),
          js: !!racine && racine.hasAttribute('data-js'),
          statique: cs('.g2g-lecteur__statique'),
          lecteur: cs('.g2g-lecteur__r2'),
          canvas: !!document.querySelector('.g2g-mur-canvas') && getComputedStyle(document.querySelector('.g2g-mur-canvas')).opacity !== '0',
          fond: !!racine && getComputedStyle(racine).backgroundImage.includes('mur-'),
          bandeAnimee: !!bande && getComputedStyle(bande).animationName !== 'none',
          collageCache: Array.from(document.querySelectorAll('[data-collage] > .g2g-cassette, [data-collage].g2g-affiche-lien')).filter((el) => getComputedStyle(el).opacity === '0' && el.getBoundingClientRect().top < innerHeight).length,
          filtres: document.querySelectorAll('.g2g-filtres a[href*="genre="]').length,
        };
      })()`)
      let ok = etat.contenu && etat.pied && erreurs.length === 0
      if (mode === 'reduit') ok = ok && !etat.bandeAnimee && etat.collageCache === 0
      if (mode === 'sans-js') ok = ok && !etat.js && etat.statique !== 'none' && etat.lecteur === 'none' && !etat.canvas && etat.fond && (chemin !== '/sorties' || etat.filtres >= 4)
      if (mode === 'sans-webgl') ok = ok && !etat.canvas && etat.fond
      if (!ok) problemes.push(`${chemin || '/'} : ${JSON.stringify({ ...etat, erreurs })}`)
      off()
      await nav.envoyer('Target.closeTarget', { targetId })
    }
    const libelle = mode === 'reduit' ? 'mouvement réduit : pages rendues, bande statique, collage immédiat, aucune erreur' : mode === 'sans-js' ? 'sans JavaScript : barre statique, filtres en liens, texture de repli, aucune erreur' : 'sans WebGL : canvas absent, texture de repli, aucune erreur'
    noter(f.largeur, `${PAGES.length} pages`, libelle, problemes.length === 0, problemes.slice(0, 2).join(' | ').slice(0, 300))
  }
}

async function main(): Promise<void> {
  if (!existsSync(AXE)) throw new Error(`axe-core absent : ${AXE} (npm pack axe-core dans .next/cache/groove-to-grave/outils, puis tar -xzf)`)
  const source = readFileSync(AXE, 'utf8')
  const nav = new Devtools()
  await nav.demarrer()
  for (const f of FORMATS) {
    await pagesAxe(nav, f, source)
    await clavier(nav, f)
    await replis(nav, f)
  }
  nav.fermer()
  const echecs = resultats.filter((r) => !r.ok)
  process.stdout.write('| Format | Page | Contrôle | Résultat |\n|---|---|---|---|\n')
  for (const r of resultats) process.stdout.write(`| ${r.format} | ${r.page} | ${r.controle} | ${r.ok ? 'ok' : 'KO'}${r.detail ? ` · ${r.detail}` : ''} |\n`)
  process.stdout.write(`\n${resultats.length - echecs.length}/${resultats.length} contrôles passés\n`)
  if (echecs.length) process.exit(1)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
