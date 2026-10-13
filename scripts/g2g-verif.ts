/**
 * Vérifications de mise en page et de comportement de « Groove To Grave » dans Chrome headless
 * (protocole DevTools, aucune dépendance), à 1440 et à 390 px, sur chaque page :
 *   - empilement : au défilement, le skin (ou la barre basse et le menu sur mobile) reste au-dessus du contenu ;
 *   - skin desktop de 132 px au plus, compteurs et spectre entièrement dans l'afficheur, 32 colonnes visibles ;
 *   - aucun chevauchement entre cartes ; stickers et scotch jamais sur une autre carte ni sur une zone cliquable ;
 *   - insertion : clone monté dans la racine, mêmes classes, police au marqueur, sticker ; l'original reste visible ;
 *   - canvas : aucun voile au chargement, fondu de 300 ms après le premier rendu ;
 *   - lecture sans coupure sur une navigation interne, puis retour et avance du navigateur ;
 *   - transition de page figée à mi-course (balayage du contenu) ; FIN DE BANDE dans l'afficheur au pied de page ;
 *   - exécution réelle du lecteur (bloc 7.3b) par quatre chemins d'arrivée, aux deux formats : URL directe,
 *     tuile depuis la home du portfolio, lien interne entre deux pages, retour puis avance du navigateur ;
 *     pour chacun : lecteur monté, AudioContext en `running` au premier vrai clic, position de l'extrait qui
 *     avance, spectre qui change entre deux images, aucune erreur de console ;
 *   - aucun titre orphelin ni section vide sur chaque page ;
 *   - aucune erreur de console, exception ni requête en échec sur chaque page ;
 *   - extrait indisponible (requêtes audio coupées) : le lecteur le dit et propose Bandcamp.
 * S'exécute contre un serveur local ou contre l'URL de production (`--url https://…`) : à lancer contre la
 * production à la fin de chaque phase. Sort une table Markdown et un code de retour.
 *
 *   npx tsx scripts/g2g-verif.ts [--url http://localhost:3000 | https://portfolio-eight-sable-66.vercel.app]
 */
import { Devtools } from './g2g-devtools'

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

/** Erreurs de console, exceptions et requêtes en échec, par session DevTools (les avertissements du pilote graphique sont ignorés). */
const erreursParSession = new Map<string, string[]>()
const BRUIT = /GL Driver Message|GPU stall|WebGL-0x/
function collecterErreurs(nav: Devtools): () => void {
  return nav.sur((m, p, sessionId) => {
    if (!sessionId) return
    const liste = erreursParSession.get(sessionId) ?? []
    if (m === 'Runtime.exceptionThrown') {
      const e = (p as { exceptionDetails: { text: string; exception?: { description?: string } } }).exceptionDetails
      liste.push(`exception : ${(e.exception?.description ?? e.text).split('\n')[0].slice(0, 160)}`)
    } else if (m === 'Runtime.consoleAPICalled') {
      const q = p as { type: string; args: { value?: unknown; description?: string }[] }
      if (q.type === 'error') liste.push(`console.error : ${q.args.map((a) => String(a.value ?? a.description ?? '')).join(' ').slice(0, 160)}`)
    } else if (m === 'Log.entryAdded') {
      const e = (p as { entry: { level: string; text: string; url?: string; source: string } }).entry
      if (e.level === 'error' && !BRUIT.test(e.text)) liste.push(`${e.source} : ${e.text.slice(0, 120)} ${e.url ?? ''}`.trim())
    }
    erreursParSession.set(sessionId, liste)
  })
}
const erreursDe = (s: string) => erreursParSession.get(s) ?? []

/** État réel du lecteur, lisible même sur un build ancien (sans `etatAudio`) ou sans moteur : rien ne doit faire planter le script. */
const ETAT_LECTEUR = `({ audio: window.__g2g && window.__g2g.etatAudio ? window.__g2g.etatAudio() : 'absent', statut: (document.querySelector('.g2g-lecteur') || { dataset: {} }).dataset.statut || 'absent', position: window.__g2g ? window.__g2g.position() : -1 })`
interface EtatLecteur {
  audio: string
  statut: string
  position: number
}

/** Chrome headless suspend requestAnimationFrame sur un onglet inactif : un screencast tient les images (GSAP, ticker, spectre). */
async function animer(nav: Devtools, s: string, targetId: string): Promise<() => Promise<void>> {
  const off = nav.sur((m, p, sessionId) => {
    if (m === 'Page.screencastFrame' && sessionId === s) void nav.envoyer('Page.screencastFrameAck', { sessionId: (p as { sessionId: number }).sessionId }, s)
  })
  await nav.envoyer('Page.startScreencast', { format: 'jpeg', quality: 30, maxWidth: 320, maxHeight: 320, everyNthFrame: 1 }, s)
  await nav.envoyer('Target.activateTarget', { targetId })
  await nav.envoyer('Emulation.setFocusEmulationEnabled', { enabled: true }, s)
  return async () => {
    await nav.envoyer('Page.stopScreencast', {}, s)
    off()
  }
}

/**
 * Exécution réelle du lecteur sur la page courante, quel que soit le chemin d'arrivée (bloc 7.3b) :
 * lecteur monté (data-js posé par React, commandes rendues, barre statique du noscript non rendue,
 * boutons écouter), AudioContext en `running` au premier vrai clic (Input.dispatchMouseEvent sur le
 * bouton écouter de la première cassette), position de l'extrait qui avance, spectre qui change entre
 * deux images. Laisse le lecteur en lecture.
 */
async function controlerLecteurReel(nav: Devtools, s: string, f: (typeof FORMATS)[number], chemin: string): Promise<void> {
  const mobile = f.largeur < 600
  const commandes = mobile ? '.g2g-barre' : '.g2g-lecteur__r2'
  const monte = await nav.evaluer<{ chemin: string; dataJs: boolean; statiqueRendue: boolean; commandes: boolean; ecouter: number; document: boolean }>(s, `(() => { const h = document.getElementById('haut'); const st = document.querySelector('.g2g-lecteur__statique'); const cmd = document.querySelector('${commandes}'); return { chemin: location.pathname, dataJs: !!h && h.hasAttribute('data-js'), statiqueRendue: !!st && st.getClientRects().length > 0, commandes: !!cmd && cmd.getClientRects().length > 0, ecouter: document.querySelectorAll('[data-g2g="ecouter"]').length, document: document.documentElement.classList.contains('g2g-document') } })()`)
  noter(f.largeur, chemin, 'lecteur monté : data-js, commandes rendues, barre statique non rendue, boutons écouter', monte.dataJs && !monte.statiqueRendue && monte.commandes && monte.ecouter > 0 && monte.document, JSON.stringify(monte))
  if (monte.ecouter === 0) return
  const avant = await nav.evaluer<EtatLecteur>(s, ETAT_LECTEUR)
  await nav.evaluer(s, `document.querySelector('[data-g2g="ecouter"]').scrollIntoView({ block: 'center', behavior: 'instant' })`)
  await attendre(400)
  await nav.cliquer(s, '[data-g2g="ecouter"]')
  await attendre(1200)
  const lecture1 = await nav.evaluer<EtatLecteur>(s, ETAT_LECTEUR)
  noter(f.largeur, chemin, 'premier vrai clic : AudioContext en running, lecteur en lecture', lecture1.audio === 'running' && lecture1.statut === 'lecture', `${avant.audio} → ${lecture1.audio}, statut ${lecture1.statut}`)
  const selSpectre = mobile ? '.g2g-feuille .g2g-spectre__niveau' : '.g2g-lecteur__afficheur .g2g-spectre__niveau'
  if (mobile) {
    await nav.cliquer(s, '[data-g2g="deplier"]')
    await attendre(500)
  }
  const image1 = await nav.evaluer<string>(s, `Array.from(document.querySelectorAll('${selSpectre}')).map((e) => e.style.transform).join('|')`)
  await attendre(700)
  const lecture2 = await nav.evaluer<EtatLecteur & { image: string }>(s, `Object.assign(${ETAT_LECTEUR}, { image: Array.from(document.querySelectorAll('${selSpectre}')).map((e) => e.style.transform).join('|') })`)
  noter(f.largeur, chemin, 'la position de l’extrait avance', lecture2.position > lecture1.position && lecture2.position > 0, `${lecture1.position.toFixed(2)} → ${lecture2.position.toFixed(2)} s`)
  noter(f.largeur, chemin, 'le spectre change entre deux images', image1 !== lecture2.image && lecture2.image.includes('scaleY(') && !/^(scaleY\(0\)\|?)+$/.test(lecture2.image), `${lecture2.image.split('|').filter((v) => v && v !== 'scaleY(0)').length}/32 colonnes allumées`)
  if (mobile) {
    await nav.cliquer(s, '[data-g2g="replier"]')
    await attendre(300)
  }
}

/** Navigation interne par le lien « sorties » du lecteur (Next Link, sans rechargement). */
async function allerAuxSorties(nav: Devtools, s: string): Promise<void> {
  await nav.evaluer(s, `(() => { const a = Array.from(document.querySelectorAll('.g2g-lecteur a[href$="/sorties"]')).pop(); a.click() })()`)
  await attendre(2000)
}

/** Dans la page : quadrilatères des cartes, stickers, scotch et cibles, et test de séparation des axes. */
const SCRIPT_CHEVAUCHEMENTS = `(() => {
  const quad = (el) => {
    const r = el.getBoundingClientRect();
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const w = el.offsetWidth || r.width, h = el.offsetHeight || r.height;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2 + window.scrollY;
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => { const p = m.transformPoint(new DOMPoint(x, y)); return [cx + p.x, cy + p.y] });
  };
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const separes = (a, b) => {
    for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const nx = y1 - y2, ny = x2 - x1;
      const proj = (p) => p.map(([x, y]) => x * nx + y * ny);
      const pa = proj(a), pb = proj(b);
      if (Math.max(...pa) <= Math.min(...pb) + 0.5 || Math.max(...pb) <= Math.min(...pa) + 0.5) return true;
    }
    return false;
  };
  const cartes = Array.from(document.querySelectorAll('.g2g-tuile, .g2g-affiche-lien, .g2g-flyer__support, .g2g-crew li, .g2g-cassette-dos')).map((el) => ({ nom: (el.textContent || '').trim().slice(0, 30), quad: quad(el.matches('.g2g-tuile') ? el.querySelector('.g2g-cassette') || el : el), el }));
  const cliquables = Array.from(document.querySelectorAll('.g2g-ecouter, .g2g-bouton, .g2g-liens a, .g2g-filtres a, .g2g-bouton-piste')).map((el) => ({ nom: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), quad: quad(el), el }));
  const decors = [];
  for (const el of document.querySelectorAll('.g2g-tuile .g2g-sticker')) decors.push({ nom: 'sticker ' + el.textContent, quad: quad(el), carte: el.closest('.g2g-tuile') });
  for (const el of document.querySelectorAll('.g2g-bande-titre, .g2g-flyer__support')) {
    const r = el.getBoundingClientRect(); const y = r.top + window.scrollY;
    const bande = el.matches('.g2g-bande-titre');
    const top = bande ? -12 : -10, w = bande ? 72 : 64, h = bande ? 22 : 20, marge = bande ? 18 : 24;
    decors.push({ nom: 'scotch gauche ' + (el.textContent || '').trim().slice(0, 12), quad: rect(r.left + marge, y + top, w, h), carte: el });
    decors.push({ nom: 'scotch droit ' + (el.textContent || '').trim().slice(0, 12), quad: rect(r.right - marge - w, y + top, w, h), carte: el });
  }
  const problemes = [];
  for (let i = 0; i < cartes.length; i++) for (let j = i + 1; j < cartes.length; j++) {
    if (cartes[i].el.contains(cartes[j].el) || cartes[j].el.contains(cartes[i].el)) continue;
    if (!separes(cartes[i].quad, cartes[j].quad)) problemes.push('cartes « ' + cartes[i].nom + ' » et « ' + cartes[j].nom + ' »');
  }
  for (const d of decors) {
    for (const c of cartes) if (!c.el.contains(d.carte) && !d.carte.contains(c.el) && c.el !== d.carte && !separes(d.quad, c.quad)) problemes.push(d.nom + ' sur la carte « ' + c.nom + ' »');
    for (const c of cliquables) if (!d.carte.contains(c.el) && !separes(d.quad, c.quad)) problemes.push(d.nom + ' sur la cible « ' + c.nom + ' »');
    for (const c of cliquables) if (d.carte.contains(c.el) && !c.el.contains(d.carte) && !separes(d.quad, c.quad)) problemes.push(d.nom + ' sur sa propre cible « ' + c.nom + ' »');
  }
  return { cartes: cartes.length, decors: decors.length, problemes };
})()`

async function verifierPage(nav: Devtools, f: (typeof FORMATS)[number], chemin: string): Promise<void> {
  const { s, targetId } = await nav.page(`${URL}${BASE}${chemin}`, f.largeur, f.hauteur, f.echelle)
  const mobile = f.largeur < 600
  // Empilement au défilement : le skin (desktop) ou la barre basse (mobile) reste au-dessus du contenu.
  const pile = await nav.evaluer<{ skin: boolean; barre: boolean | null; menu: boolean | null; hauteurSkin: number }>(s, `(async () => {
    window.scrollTo(0, 700); await new Promise(r => setTimeout(r, 250));
    const dessus = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const pts = [[r.left + 8, r.top + 8], [r.left + r.width / 2, r.top + r.height / 2], [r.right - 8, r.bottom - 8]]; return pts.every(([x, y]) => { const e = document.elementFromPoint(x, y); return e && el.contains(e) }) };
    const skin = ${mobile} ? dessus('.g2g-lecteur__r1') : dessus('.g2g-lecteur');
    const barre = ${mobile} ? dessus('.g2g-barre') : null;
    let menu = null;
    if (${mobile}) { document.querySelector('[data-g2g="menu"]').click(); await new Promise(r => setTimeout(r, 300)); menu = dessus('.g2g-menu'); document.querySelector('[data-g2g="menu"]').click(); await new Promise(r => setTimeout(r, 200)); }
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200));
    return { skin, barre, menu, hauteurSkin: document.querySelector('.g2g-lecteur').offsetHeight };
  })()`)
  noter(f.largeur, chemin, 'skin au-dessus du contenu au défilement', pile.skin, `${pile.hauteurSkin} px`)
  if (mobile) {
    noter(f.largeur, chemin, 'barre basse au-dessus du contenu', pile.barre === true)
    noter(f.largeur, chemin, 'menu au-dessus du contenu', pile.menu === true)
  }
  // Chevauchements.
  const chev = await nav.evaluer<{ cartes: number; decors: number; problemes: string[] }>(s, SCRIPT_CHEVAUCHEMENTS)
  noter(f.largeur, chemin, `chevauchements (${chev.cartes} cartes, ${chev.decors} décors)`, chev.problemes.length === 0, chev.problemes.join(' ; '))
  // Aucun titre laissé seul ni section vide : un texte absent (brouillon non publié le jour du
  // domaine final, champ vide) doit emporter sa section, pas laisser un trou (bloc 7.6).
  const creux = await nav.evaluer<{ titres: string[]; sections: string[] }>(s, `(() => {
    const vide = (el) => el.innerText.trim().length === 0;
    const visible = (el) => el.getClientRects().length > 0;
    const titres = Array.from(document.querySelectorAll('main h1, main h2, main h3')).filter((h) => {
      const section = h.closest('section, article');
      if (!section || !visible(section)) return false;
      const reste = Array.from(section.children).filter((c) => c !== h && !c.contains(h));
      return reste.length === 0 || reste.every((c) => vide(c));
    }).map((h) => h.textContent.trim().slice(0, 40));
    const sections = Array.from(document.querySelectorAll('main section, main article')).filter((x) => visible(x) && vide(x)).map((x) => x.className || x.tagName);
    return { titres, sections };
  })()`)
  noter(f.largeur, chemin, 'aucun titre orphelin ni section vide', creux.titres.length === 0 && creux.sections.length === 0, [...creux.titres, ...creux.sections].join(' ; '))
  const erreurs = erreursDe(s)
  noter(f.largeur, chemin, 'aucune erreur de console ni requête en échec', erreurs.length === 0, erreurs.slice(0, 3).join(' ; '))
  await nav.envoyer('Target.closeTarget', { targetId })
}

async function verifierLecteur(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const mobile = f.largeur < 600
  const { s, targetId } = await nav.page(`${URL}${BASE}/sorties`, f.largeur, f.hauteur, f.echelle)
  const arreter = await animer(nav, s, targetId)
  // Chemin 1 : URL directe.
  await controlerLecteurReel(nav, s, f, 'URL directe → /sorties')
  // Insertion d'une autre cassette : le clone est examiné dans la tâche même du clic (Chrome headless suspend les
  // images d'animation par à-coups, le vol de 450 ms n'y est pas mesurable ; les vidéos le montrent).
  await nav.evaluer(s, `(() => { const b = document.querySelectorAll('[data-g2g="ecouter"]')[1]; b.scrollIntoView({ block: 'center', behavior: 'instant' }); })()`)
  // Le collage à l'arrivée (IntersectionObserver) doit avoir posé la cassette avant le clic.
  await attendre(400)
  const clone = await nav.evaluer<{ present: boolean; racine: boolean; classes: string; sticker: boolean; stickerOrigine: boolean; police: string; original: number; texte: boolean }>(s, `(() => {
    const b = document.querySelectorAll('[data-g2g="ecouter"]')[1];
    b.click();
    const c = document.querySelector('.g2g-insertion');
    const o = b.closest('.g2g-tuile');
    const t = c && Array.from(c.querySelectorAll('text')).find((x) => /marker/i.test(x.getAttribute('style') || ''));
    return { present: !!c, racine: !!c && c.parentElement === document.getElementById('haut'), classes: c ? c.className : '', sticker: !!c && !!c.querySelector('.g2g-sticker'), stickerOrigine: !!o.querySelector('.g2g-sticker'), police: t ? getComputedStyle(t).fontFamily : '', original: o ? Number(getComputedStyle(o.querySelector('.g2g-cassette')).opacity) : 0, texte: !!c && !!c.querySelector('.g2g-cassette__texte') };
  })()`)
  noter(f.largeur, '/sorties', 'clone d’insertion dans la racine .g2g, mêmes classes', clone.present && clone.racine && clone.classes.includes('g2g-tuile'), clone.classes)
  noter(f.largeur, '/sorties', 'clone : police au marqueur et sticker', /marker|permanent/i.test(clone.police) && clone.sticker === clone.stickerOrigine && !clone.texte, clone.police.slice(0, 40))
  noter(f.largeur, '/sorties', 'cassette d’origine visible pendant le vol', clone.original === 1)
  await attendre(1200)
  if (!mobile) {
    const aff = await nav.evaluer<{ skin: number; dedans: boolean; colonnes: number; visibles: number; presets: number; debordements: string[] }>(s, `(() => {
      const aff = document.querySelector('.g2g-lecteur__afficheur').getBoundingClientRect();
      const dans = (el) => { const r = el.getBoundingClientRect(); return r.top >= aff.top - 0.5 && r.bottom <= aff.bottom + 0.5 && r.left >= aff.left - 0.5 && r.right <= aff.right + 0.5 };
      const elems = Array.from(document.querySelectorAll('.g2g-lecteur__afficheur .g2g-compteurs dd, .g2g-lecteur__afficheur .g2g-compteurs dt, .g2g-lecteur__afficheur .g2g-spectre, .g2g-lecteur__afficheur .g2g-presets button, .g2g-lecteur__afficheur .g2g-bande'));
      const debordements = elems.filter((el) => !dans(el)).map((el) => el.className || el.tagName);
      const colonnes = document.querySelectorAll('.g2g-lecteur__afficheur .g2g-spectre__colonne');
      const visibles = Array.from(colonnes).filter((c) => { const r = c.getBoundingClientRect(); return r.width >= 1 && r.height >= 29 && getComputedStyle(c).backgroundColor !== 'rgba(0, 0, 0, 0)' }).length;
      const lecteur = document.querySelector('.g2g-lecteur');
      const debordeSkin = Array.from(lecteur.querySelectorAll('.g2g-lecteur__r2 *')).filter((el) => { const r = el.getBoundingClientRect(); const k = lecteur.getBoundingClientRect(); return r.height && (r.top < k.top || r.bottom > k.bottom) }).map((el) => el.className || el.tagName);
      return { skin: lecteur.offsetHeight, dedans: debordements.length === 0, colonnes: colonnes.length, visibles, presets: document.querySelectorAll('.g2g-lecteur__afficheur .g2g-presets button').length, debordements: debordements.concat(debordeSkin) };
    })()`)
    noter(f.largeur, '/sorties', 'skin desktop de 132 px au plus', aff.skin <= 132, `${aff.skin} px`)
    noter(f.largeur, '/sorties', 'compteurs, spectre, presets et bande entièrement dans l’afficheur, rien hors du skin', aff.dedans && aff.debordements.length === 0, aff.debordements.join(', '))
    noter(f.largeur, '/sorties', '32 colonnes du spectre visibles, éteintes comprises', aff.colonnes === 32 && aff.visibles === 32, `${aff.visibles}/${aff.colonnes}`)
  } else {
    await nav.cliquer(s, '[data-g2g="deplier"]')
    await attendre(500)
    const feuille = await nav.evaluer<{ ouverte: boolean; dessus: boolean; colonnes: number }>(s, `(() => {
      const fe = document.querySelector('.g2g-feuille');
      const r = fe.getBoundingClientRect();
      const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { ouverte: !fe.hidden && r.height > 100, dessus: !!e && fe.contains(e), colonnes: fe.querySelectorAll('.g2g-spectre__colonne').length };
    })()`)
    noter(f.largeur, '/sorties', 'feuille mobile ouverte en lecture, au-dessus du contenu', feuille.ouverte && feuille.dessus, `${feuille.colonnes} colonnes`)
    await nav.cliquer(s, '[data-g2g="replier"]')
    await attendre(300)
  }
  // Lecture sans coupure : navigation interne, puis retour et avance du navigateur.
  const etatLecture = `({ chemin: location.pathname, statut: document.querySelector('.g2g-lecteur').dataset.statut, t: window.__g2g ? window.__g2g.position() : -1 })`
  const avant = await nav.evaluer<number>(s, `window.__g2g ? window.__g2g.position() : -1`)
  if (mobile) {
    await nav.cliquer(s, '[data-g2g="menu"]')
    await attendre(300)
    await nav.cliquer(s, '.g2g-menu__nav a[href$="/artistes"]')
  } else await nav.cliquer(s, '.g2g-lecteur__nav a[href$="/artistes"]')
  await attendre(1500)
  const apresNav = await nav.evaluer<{ chemin: string; statut: string; t: number }>(s, etatLecture)
  await nav.evaluer(s, 'history.back()')
  await attendre(1500)
  const apresRetour = await nav.evaluer<{ chemin: string; statut: string; t: number }>(s, etatLecture)
  await nav.evaluer(s, 'history.forward()')
  await attendre(1500)
  const apresAvant = await nav.evaluer<{ chemin: string; statut: string; t: number }>(s, etatLecture)
  const continu = apresNav.statut === 'lecture' && apresRetour.statut === 'lecture' && apresAvant.statut === 'lecture' && apresNav.t > avant && apresRetour.t > apresNav.t && apresAvant.t > apresRetour.t
  noter(f.largeur, '/sorties', 'lecture sans coupure : lien, retour, avance du navigateur', continu && apresNav.chemin.endsWith('/artistes') && apresRetour.chemin.endsWith('/sorties') && apresAvant.chemin.endsWith('/artistes'), `${avant.toFixed(1)} → ${apresNav.t.toFixed(1)} → ${apresRetour.t.toFixed(1)} → ${apresAvant.t.toFixed(1)} s`)
  // Transition figée à mi-course : balayage à 50 %, puis libérée.
  const fige = await nav.evaluer<{ attribut: boolean; valeur: string; libere: boolean }>(s, `(() => { window.__g2g.figerTransition(0.5); const m = document.getElementById('contenu'); const attribut = m.hasAttribute('data-balayage'); const valeur = m.style.getPropertyValue('--balayage'); window.__g2g.figerTransition(null); return { attribut, valeur, libere: !m.hasAttribute('data-balayage') } })()`)
  noter(f.largeur, '/artistes', 'transition figée à mi-course puis libérée (balayage)', fige.attribut && fige.valeur === '50%' && fige.libere, fige.valeur)
  // Fin de bande : le pied de page à l'écran remplace les compteurs (desktop) et ouvre la bande (mobile), puis tout revient.
  await nav.evaluer(s, `document.getElementById('fin-de-bande').scrollIntoView({ block: 'end', behavior: 'instant' })`)
  await attendre(700)
  const fin = await nav.evaluer<{ compteurs: boolean; bande: boolean }>(s, `({ compteurs: !!document.querySelector('.g2g-compteurs--fin'), bande: (document.querySelector('.g2g-barre .g2g-bande') || document.querySelector('.g2g-bande')).textContent.includes('FIN DE BANDE') })`)
  await nav.evaluer(s, `window.scrollTo(0, 0)`)
  await attendre(700)
  const retourHaut = await nav.evaluer<{ compteurs: boolean; bande: boolean }>(s, `({ compteurs: !!document.querySelector('.g2g-compteurs--fin'), bande: (document.querySelector('.g2g-barre .g2g-bande') || document.querySelector('.g2g-bande')).textContent.includes('FIN DE BANDE') })`)
  noter(f.largeur, '/artistes', 'FIN DE BANDE dans l’afficheur au pied de page, compteurs de retour en haut', (mobile ? fin.bande : fin.compteurs && fin.bande) && !retourHaut.compteurs && !retourHaut.bande)
  // La police de l'afficheur ne doit pas peser avant l'image LCP : elle n'est demandée qu'une fois
  // la racine montée (famille appliquée sous [data-js] seulement, bloc 7.4c).
  const police = await nav.evaluer<{ demandee: boolean; debut: number; lcp: number; dcl: number }>(s, `(() => {
    const r = performance.getEntriesByType('resource').find((e) => /vt323/i.test(e.name));
    const l = performance.getEntriesByType('largest-contentful-paint').pop();
    const n = performance.getEntriesByType('navigation')[0];
    return { demandee: !!r, debut: r ? r.startTime : -1, lcp: l ? l.startTime : -1, dcl: n ? n.domContentLoadedEventEnd : -1 };
  })()`)
  noter(f.largeur, '/sorties', 'police de l’afficheur demandée après le contenu principal, jamais avant', !police.demandee || (police.debut > police.lcp && police.debut > police.dcl), `demandée à ${police.debut.toFixed(0)} ms, LCP ${police.lcp.toFixed(0)} ms, DOM prêt ${police.dcl.toFixed(0)} ms`)
  const erreurs = erreursDe(s)
  noter(f.largeur, '/sorties', 'aucune erreur de console pendant le parcours du lecteur', erreurs.length === 0, erreurs.slice(0, 3).join(' ; '))
  await arreter()
  await nav.envoyer('Target.closeTarget', { targetId })
}

/**
 * Extrait indisponible (bloc 7.5a) : on fait échouer les requêtes audio au niveau du réseau, puis
 * on clique sur écouter. Le lecteur doit le dire en clair (« extrait indisponible »), proposer le
 * lien Bandcamp, et ne pas rester en lecture à souffler dans le vide.
 */
async function verifierExtraitIndisponible(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const chemin = 'extrait introuvable'
  const { s, targetId } = await nav.page(`${URL}${BASE}/sorties`, f.largeur, f.hauteur, f.echelle)
  const arreter = await animer(nav, s, targetId)
  await nav.envoyer('Fetch.enable', { patterns: [{ urlPattern: '*.mp3', requestStage: 'Request' }] }, s)
  const off = nav.sur((m, p, sessionId) => {
    if (m === 'Fetch.requestPaused' && sessionId === s) void nav.envoyer('Fetch.failRequest', { requestId: (p as { requestId: string }).requestId, errorReason: 'Failed' }, s)
  })
  await nav.evaluer(s, `document.querySelector('[data-g2g="ecouter"]').scrollIntoView({ block: 'center', behavior: 'instant' })`)
  await attendre(400)
  await nav.cliquer(s, '[data-g2g="ecouter"]')
  // Le moteur laisse 3 s à l'extrait avant de déclarer l'échec.
  await attendre(4500)
  // Le message est rendu partout où vit la bande (skin, ligne fine, barre mobile, feuille) : il
  // suffit qu'au moins une de ces places soit réellement visible au format mesuré.
  const etat = await nav.evaluer<{ message: boolean; texte: string; bandcamp: string | null; statut: string; position: number }>(s, `(() => {
    const tous = Array.from(document.querySelectorAll('[data-g2g="echec"]'));
    const visible = tous.find((e) => e.getClientRects().length > 0);
    const a = visible && visible.querySelector('[data-g2g="echec-bandcamp"]');
    return { message: !!visible, texte: (visible || tous[0] || { textContent: '' }).textContent.trim().slice(0, 60), bandcamp: a ? a.getAttribute('href') : null, statut: document.querySelector('.g2g-lecteur').dataset.statut, position: window.__g2g.position() };
  })()`)
  noter(f.largeur, chemin, 'le lecteur annonce l’extrait indisponible et renvoie sur Bandcamp', etat.message && /INDISPONIBLE/i.test(etat.texte) && Boolean(etat.bandcamp?.includes('bandcamp')), `${etat.texte} · ${etat.bandcamp ?? 'aucun lien'}`)
  noter(f.largeur, chemin, 'le lecteur ne reste pas en lecture', etat.statut !== 'lecture' && etat.position <= 0.05, `statut ${etat.statut}, position ${etat.position.toFixed(2)} s`)
  off()
  await nav.envoyer('Fetch.disable', {}, s)
  await arreter()
  await nav.envoyer('Target.closeTarget', { targetId })
}

/**
 * Chemin 2 : entrée par navigation côté client depuis la home du portfolio, « Découvrir mes projets »,
 * puis la tuile (Next Link, sans rechargement). Le layout de l'expérience se monte sans aucun
 * chargement de page : le lecteur doit être là et jouer au premier vrai clic (bloc 7.3b).
 */
async function verifierEntreeTuile(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const chemin = 'tuile du portfolio → accueil'
  const { s, targetId } = await nav.page(`${URL}/`, f.largeur, f.hauteur, f.echelle)
  const arreter = await animer(nav, s, targetId)
  await attendre(1500)
  const ouvert = await nav.evaluer<boolean>(s, `(() => { const b = Array.from(document.querySelectorAll('a, button')).find((e) => /découvrir mes projets/i.test(e.textContent || '')); if (!b) return false; b.click(); return true })()`)
  await attendre(2500)
  const tuile = await nav.evaluer<boolean>(s, `(() => { const l = document.querySelector('article.project-card a[href="/experience/groove-to-grave"]'); if (!l) return false; l.click(); return true })()`)
  await attendre(5000)
  const arrive = await nav.evaluer<string>(s, 'location.pathname')
  noter(f.largeur, chemin, 'home du portfolio, « Découvrir mes projets », tuile : arrivée sans rechargement', ouvert && tuile && arrive === BASE, arrive)
  if (arrive === BASE) await controlerLecteurReel(nav, s, f, chemin)
  const erreurs = erreursDe(s)
  noter(f.largeur, chemin, 'aucune erreur de console pendant le parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' ; '))
  await arreter()
  await nav.envoyer('Target.closeTarget', { targetId })
}

/** Chemin 3 : navigation interne, de l'accueil de l'expérience vers /sorties par le lien du lecteur. */
async function verifierNavigationInterne(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const chemin = 'lien interne accueil → /sorties'
  const { s, targetId } = await nav.page(`${URL}${BASE}`, f.largeur, f.hauteur, f.echelle)
  const arreter = await animer(nav, s, targetId)
  await allerAuxSorties(nav, s)
  const arrive = await nav.evaluer<string>(s, 'location.pathname')
  noter(f.largeur, chemin, 'arrivée sur /sorties par le lien du lecteur', arrive === `${BASE}/sorties`, arrive)
  if (arrive === `${BASE}/sorties`) await controlerLecteurReel(nav, s, f, chemin)
  const erreurs = erreursDe(s)
  noter(f.largeur, chemin, 'aucune erreur de console pendant le parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' ; '))
  await arreter()
  await nav.envoyer('Target.closeTarget', { targetId })
}

/** Chemin 4 : retour puis avance du navigateur (accueil → /sorties, retour à l'accueil, avance vers /sorties). */
async function verifierRetourAvance(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const chemin = 'retour puis avance → /sorties'
  const { s, targetId } = await nav.page(`${URL}${BASE}`, f.largeur, f.hauteur, f.echelle)
  const arreter = await animer(nav, s, targetId)
  await allerAuxSorties(nav, s)
  await nav.evaluer(s, 'history.back()')
  await attendre(1500)
  const apresRetour = await nav.evaluer<{ chemin: string; dataJs: boolean }>(s, `({ chemin: location.pathname, dataJs: document.getElementById('haut').hasAttribute('data-js') })`)
  await nav.evaluer(s, 'history.forward()')
  await attendre(1500)
  const arrive = await nav.evaluer<string>(s, 'location.pathname')
  noter(f.largeur, chemin, 'retour à l’accueil (lecteur monté) puis avance vers /sorties', apresRetour.chemin === BASE && apresRetour.dataJs && arrive === `${BASE}/sorties`, `${apresRetour.chemin} (data-js ${apresRetour.dataJs}) → ${arrive}`)
  if (arrive === `${BASE}/sorties`) await controlerLecteurReel(nav, s, f, chemin)
  const erreurs = erreursDe(s)
  noter(f.largeur, chemin, 'aucune erreur de console pendant le parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' ; '))
  await arreter()
  await nav.envoyer('Target.closeTarget', { targetId })
}

/** Canvas : captures à 80, 400 et 1200 ms après le chargement ; le coin au-dessus du skin ne doit jamais s'assombrir. */
async function verifierCanvas(nav: Devtools, f: (typeof FORMATS)[number]): Promise<void> {
  const { targetId } = await nav.envoyer<{ targetId: string }>('Target.createTarget', { url: 'about:blank' })
  const { sessionId: s } = await nav.envoyer<{ sessionId: string }>('Target.attachToTarget', { targetId, flatten: true })
  await nav.envoyer('Page.enable', {}, s)
  await nav.envoyer('Runtime.enable', {}, s)
  await nav.envoyer('Emulation.setDeviceMetricsOverride', { width: f.largeur, height: f.hauteur, deviceScaleFactor: 1, mobile: f.largeur < 600 }, s)
  const charge = nav.attendre('Page.loadEventFired')
  await nav.envoyer('Page.navigate', { url: `${URL}${BASE}/label` }, s)
  await charge
  const sharp = (await import('sharp')).default
  const mesures: number[] = []
  const debut = Date.now()
  for (const t of [80, 400, 1200]) {
    const reste = t - (Date.now() - debut)
    if (reste > 0) await attendre(reste)
    const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png', clip: { x: f.largeur - 60, y: 0, width: 50, height: 12, scale: 1 } }, s)
    const { data: px, info } = await sharp(Buffer.from(data, 'base64')).raw().toBuffer({ resolveWithObject: true })
    let somme = 0
    for (let i = 0; i < px.length; i += info.channels) somme += (px[i] + px[i + 1] + px[i + 2]) / 3
    mesures.push(Math.round(somme / (px.length / info.channels)))
  }
  const etat = await nav.evaluer<{ pret: boolean; opacite: string; transition: string }>(s, `(() => { const c = document.querySelector('.g2g-mur-canvas'); return { pret: !!c && c.hasAttribute('data-pret'), opacite: c ? getComputedStyle(c).opacity : '', transition: c ? getComputedStyle(c).transitionDuration : '' } })()`)
  // Un voile assombrirait le coin pendant le fondu : les trois mesures doivent rester claires et à 12 niveaux près les unes des autres.
  noter(f.largeur, '/label', 'canvas : aucun voile au chargement (luminance du coin à 80, 400 et 1200 ms)', mesures.every((m) => m >= 180) && Math.max(...mesures) - Math.min(...mesures) <= 12, mesures.join(', '))
  noter(f.largeur, '/label', 'canvas prêt, opacité 1, fondu de 300 ms', etat.pret && etat.opacite === '1' && etat.transition === '0.3s', `${etat.opacite}, ${etat.transition}`)
  await nav.envoyer('Target.closeTarget', { targetId })
}

async function main(): Promise<void> {
  const nav = new Devtools()
  await nav.demarrer()
  const off = collecterErreurs(nav)
  for (const f of FORMATS) {
    for (const p of PAGES) await verifierPage(nav, f, p)
    await verifierLecteur(nav, f)
    await verifierEntreeTuile(nav, f)
    await verifierNavigationInterne(nav, f)
    await verifierRetourAvance(nav, f)
    await verifierExtraitIndisponible(nav, f)
    await verifierCanvas(nav, f)
  }
  off()
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
