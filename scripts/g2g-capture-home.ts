/**
 * Bloc 7.1 : capture de la home du portfolio en production et de la tuile « Groove To Grave
 * Records » dans le carrousel des projets perso, à 1440 et à 390 px ; vérifie l'image de la
 * tuile, son accent (#F14442 posé par src/lib/accents.ts) et que le clic mène au site.
 * Chrome headless par le pilote partagé.
 *
 *   npx tsx scripts/g2g-capture-home.ts [--url https://portfolio-eight-sable-66.vercel.app]
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { Devtools } from './g2g-devtools'
import { RACINE, dossier } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'https://portfolio-eight-sable-66.vercel.app').replace(/\/$/, '')
const SORTIE = dossier(join(RACINE, 'docs/groove-to-grave/planches/phase-7.1'))
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Tuile {
  trouvee: boolean
  image: string
  accent: string
  categorieEntreprise: boolean
  href: string
  x: number
  y: number
  w: number
  h: number
}

async function main(): Promise<void> {
  const nav = new Devtools()
  await nav.demarrer()
  for (const f of [{ largeur: 1440, hauteur: 900, echelle: 1 }, { largeur: 390, hauteur: 844, echelle: 2 }]) {
    // La home a trois panneaux (hero, projects, about) : comme un visiteur, on clique « Découvrir mes projets ».
    const { s, targetId } = await nav.page(`${URL}/`, f.largeur, f.hauteur, f.echelle)
    await attendre(1500)
    const bouton = await nav.evaluer<{ x: number; y: number } | null>(s, `(() => { const b = Array.from(document.querySelectorAll('a, button')).find((e) => /découvrir mes projets/i.test(e.textContent || '')); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
    if (!bouton) throw new Error('bouton « Découvrir mes projets » introuvable')
    await nav.envoyer('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bouton.x, y: bouton.y }, s)
    await nav.envoyer('Input.dispatchMouseEvent', { type: 'mousePressed', x: bouton.x, y: bouton.y, button: 'left', clickCount: 1 }, s)
    await nav.envoyer('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bouton.x, y: bouton.y, button: 'left', clickCount: 1 }, s)
    await attendre(2500)
    const t = await nav.evaluer<Tuile>(s, `(() => {
      const lien = document.querySelector('article.project-card a[href="/experience/groove-to-grave"]');
      if (!lien) return { trouvee: false };
      const carte = lien.closest('article.project-card');
      carte.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = carte.getBoundingClientRect();
      const fond = carte.querySelector('.project-card-bg');
      const image = fond && (fond.style.backgroundImage || '').includes('groove-to-grave/tuile.svg') ? 'tuile.svg' : 'absente';
      // Le filtre actif de la home : « perso » ou « entreprise ».
      const filtre = Array.from(document.querySelectorAll('button')).find((b) => /entreprise/i.test(b.textContent || '') && b.getAttribute('aria-pressed') === 'true');
      return { trouvee: true, image, accent: getComputedStyle(carte).getPropertyValue('--card-accent').trim(), categorieEntreprise: !!filtre, href: lien.getAttribute('href'), x: r.left, y: r.top, w: r.width, h: r.height };
    })()`)
    process.stdout.write(`${f.largeur} : ${JSON.stringify(t)}\n`)
    await attendre(600)
    const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
    const png = Buffer.from(data, 'base64')
    await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(join(SORTIE, `home-${f.largeur}.jpg`))
    if (t.trouvee) {
      const marge = 24
      const left = Math.max(0, Math.round((t.x - marge) * f.echelle))
      const top = Math.max(0, Math.round((t.y - marge) * f.echelle))
      const width = Math.min(Math.round((t.w + marge * 2) * f.echelle), f.largeur * f.echelle - left)
      const height = Math.min(Math.round((t.h + marge * 2) * f.echelle), f.hauteur * f.echelle - top)
      await sharp(png).extract({ left, top, width, height }).jpeg({ quality: 90, mozjpeg: true }).toFile(join(SORTIE, `tuile-${f.largeur}.jpg`))
      // Survol de la carte (le lien se révèle au hover), puis clic sur le lien : la navigation doit mener au site.
      await nav.envoyer('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t.x + t.w / 2, y: t.y + t.h / 2 }, s)
      await attendre(700)
      const lien = await nav.evaluer<{ x: number; y: number; dessus: string }>(s, `(() => { const l = document.querySelector('article.project-card a[href="/experience/groove-to-grave"]'); const r = l.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { x: r.left + r.width / 2, y: r.top + r.height / 2, dessus: e === l ? 'lien' : (e ? e.tagName : 'rien') } })()`)
      process.stdout.write(`${f.largeur} : au survol, sous le pointeur → ${lien.dessus}\n`)
      await nav.envoyer('Input.dispatchMouseEvent', { type: 'mousePressed', x: lien.x, y: lien.y, button: 'left', clickCount: 1 }, s)
      await nav.envoyer('Input.dispatchMouseEvent', { type: 'mouseReleased', x: lien.x, y: lien.y, button: 'left', clickCount: 1 }, s)
      await attendre(2500)
      const apres = await nav.evaluer<string>(s, 'location.pathname')
      process.stdout.write(`${f.largeur} : après clic → ${apres}\n`)
      writeFileSync(join(SORTIE, `resultat-${f.largeur}.json`), JSON.stringify({ ...t, apresClic: apres }, null, 2))
    }
    await nav.envoyer('Target.closeTarget', { targetId })
  }
  nav.fermer()
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
