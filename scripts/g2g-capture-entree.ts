/**
 * Preuve en production du chemin d'arrivée par la tuile (bloc 7.3b) : home du portfolio,
 * « Découvrir mes projets », tuile Groove To Grave (Next Link, sans rechargement), puis un vrai
 * clic sur le bouton écouter de la première cassette. Capture de l'écran en lecture, aux deux
 * formats, avec l'état du lecteur (AudioContext, statut, position) écrit dans le nom du fichier.
 *
 *   npx tsx scripts/g2g-capture-entree.ts [--url https://portfolio-eight-sable-66.vercel.app] [--sortie docs/groove-to-grave/planches/phase-7.3b]
 */
import { join } from 'node:path'
import sharp from 'sharp'
import { Devtools } from './g2g-devtools'
import { RACINE, dossier } from './g2g-lib'

const arg = (nom: string, defaut: string) => {
  const i = process.argv.indexOf(nom)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : defaut
}
const URL = arg('--url', 'https://portfolio-eight-sable-66.vercel.app').replace(/\/$/, '')
const SORTIE = dossier(join(RACINE, arg('--sortie', 'docs/groove-to-grave/planches/phase-7.3b')))
const FORMATS = [
  { largeur: 1440, hauteur: 900, echelle: 1 },
  { largeur: 390, hauteur: 844, echelle: 2 },
] as const
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main(): Promise<void> {
  const nav = new Devtools()
  await nav.demarrer()
  let echecs = 0
  for (const f of FORMATS) {
    const mobile = f.largeur < 600
    const { s, targetId } = await nav.page(`${URL}/`, f.largeur, f.hauteur, f.echelle)
    const off = nav.sur((m, p, sessionId) => {
      if (m === 'Page.screencastFrame' && sessionId === s) void nav.envoyer('Page.screencastFrameAck', { sessionId: (p as { sessionId: number }).sessionId }, s)
    })
    await nav.envoyer('Page.startScreencast', { format: 'jpeg', quality: 30, maxWidth: 320, maxHeight: 320, everyNthFrame: 1 }, s)
    await nav.envoyer('Target.activateTarget', { targetId })
    await attendre(1500)
    await nav.evaluer(s, `(() => { const b = Array.from(document.querySelectorAll('a, button')).find((e) => /découvrir mes projets/i.test(e.textContent || '')); if (b) b.click() })()`)
    await attendre(2500)
    const { data: tuile } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
    await sharp(Buffer.from(tuile, 'base64')).jpeg({ quality: 85, mozjpeg: true }).toFile(join(SORTIE, `${f.largeur}-1-tuile.jpg`))
    await nav.evaluer(s, `(() => { const l = document.querySelector('article.project-card a[href="/experience/groove-to-grave"]'); if (l) l.click() })()`)
    await attendre(5000)
    const { data: arrivee } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
    await sharp(Buffer.from(arrivee, 'base64')).jpeg({ quality: 85, mozjpeg: true }).toFile(join(SORTIE, `${f.largeur}-2-arrivee.jpg`))
    await nav.evaluer(s, `document.querySelector('[data-g2g="ecouter"]').scrollIntoView({ block: 'center', behavior: 'instant' })`)
    await attendre(400)
    await nav.cliquer(s, '[data-g2g="ecouter"]')
    await attendre(1500)
    if (mobile) {
      await nav.cliquer(s, '[data-g2g="deplier"]')
      await attendre(600)
    }
    const etat = await nav.evaluer<{ chemin: string; dataJs: boolean; audio: string; statut: string; position: number; statique: boolean }>(s, `({ chemin: location.pathname, dataJs: document.getElementById('haut').hasAttribute('data-js'), audio: window.__g2g.etatAudio(), statut: document.querySelector('.g2g-lecteur').dataset.statut, position: window.__g2g.position(), statique: !!document.querySelector('.g2g-lecteur__statique') && document.querySelector('.g2g-lecteur__statique').getClientRects().length > 0 })`)
    const { data } = await nav.envoyer<{ data: string }>('Page.captureScreenshot', { format: 'png' }, s)
    const ok = etat.dataJs && etat.audio === 'running' && etat.statut === 'lecture' && etat.position > 0 && !etat.statique
    if (!ok) echecs++
    const nom = `${f.largeur}-3-lecture-${etat.audio}-${etat.statut}-${etat.position.toFixed(1)}s.jpg`
    await sharp(Buffer.from(data, 'base64')).jpeg({ quality: 85, mozjpeg: true }).toFile(join(SORTIE, nom))
    process.stdout.write(`${ok ? 'ok' : 'KO'} ${f.largeur} ${JSON.stringify(etat)} → ${nom}\n`)
    await nav.envoyer('Page.stopScreencast', {}, s)
    off()
    await nav.envoyer('Target.closeTarget', { targetId })
  }
  nav.fermer()
  if (echecs) process.exit(1)
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
