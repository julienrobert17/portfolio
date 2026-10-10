/**
 * Repli statique du mur : la texture AVIF et WebP générée depuis le même shader que le canvas
 * (canvas/mur-shader.ts), rendue dans Chrome headless (protocole DevTools, aucune dépendance)
 * sur une page vide, en deux largeurs. Sert de fond CSS quand WebGL2 est absent, en attendant
 * le canvas, et en mouvement réduit si le canvas ne tourne pas.
 *
 *   npx tsx scripts/g2g-mur-statique.ts
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { FRAGMENT, VERTEX, rgb01 } from '../src/components/experience/groove-to-grave/canvas/mur-shader'
import { couleurs } from '../src/components/experience/groove-to-grave/tokens'
import { Devtools } from './g2g-devtools'
import { PUBLIC, RACINE, dossier } from './g2g-lib'

const TAILLES = [
  { largeur: 1920, hauteur: 1200, nom: 'mur-1920' },
  { largeur: 1280, hauteur: 2200, nom: 'mur-1280' },
]

async function main(): Promise<void> {
  const nav = new Devtools()
  await nav.demarrer()
  for (const t of TAILLES) {
    const { s, targetId } = await nav.page('about:blank', t.largeur, t.hauteur, 1)
    const script = `(() => {
      const c = document.createElement('canvas'); c.width = ${t.largeur}; c.height = ${t.hauteur}; document.body.appendChild(c);
      const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
      if (!gl) return 'pas de webgl2';
      const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, ${JSON.stringify(VERTEX)})); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, ${JSON.stringify(FRAGMENT)})); gl.linkProgram(p); gl.useProgram(p);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(p, 'a_pos'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      const u = (n) => gl.getUniformLocation(p, n);
      gl.uniform3fv(u('u_wall'), ${JSON.stringify(rgb01(couleurs.wall))}); gl.uniform3fv(u('u_poster'), ${JSON.stringify(rgb01(couleurs.poster))}); gl.uniform3fv(u('u_red'), ${JSON.stringify(rgb01(couleurs.red))}); gl.uniform3fv(u('u_green'), ${JSON.stringify(rgb01(couleurs.green))});
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(u('u_resolution'), c.width, c.height); gl.uniform1f(u('u_temps'), 0); gl.uniform1f(u('u_graves'), 0); gl.uniform1f(u('u_coup'), 0); gl.uniform1f(u('u_echelle'), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return c.toDataURL('image/png').split(',')[1];
    })()`
    const b64 = await nav.evaluer<string>(s, script)
    await nav.envoyer('Target.closeTarget', { targetId })
    if (!b64 || b64 === 'pas de webgl2') throw new Error(`${t.nom} : ${b64 || 'rendu vide'}`)
    const png = Buffer.from(b64, 'base64')
    dossier(PUBLIC)
    for (const format of ['avif', 'webp'] as const) {
      const sortie = join(PUBLIC, `${t.nom}.${format}`)
      const buf = await sharp(png)[format]({ quality: format === 'avif' ? 48 : 74, effort: format === 'avif' ? 6 : 5 }).toBuffer()
      writeFileSync(sortie, buf)
      process.stdout.write(`${sortie.replace(RACINE + '/', '')} (${Math.round(buf.length / 1024)} kB)\n`)
    }
  }
  nav.fermer()
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`)
  process.exit(1)
})
