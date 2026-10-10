/**
 * Vérifie chaque paire texte/fond de tokens.ts : 4,5:1 pour le texte courant, 3:1 pour le texte
 * de 24 px et plus et les éléments d'interface, 4,6:1 pour redInk sur wall.
 *   npm run test:g2g-tokens
 */
import { MINIMUM_RED_INK_WALL, PAIRES, contraste, couleurs } from './tokens'

let echecs = 0
for (const p of PAIRES) {
  const minimum = p.texte === 'redInk' && p.fond === 'wall' ? MINIMUM_RED_INK_WALL : p.minimum
  const valeur = contraste(couleurs[p.texte], couleurs[p.fond])
  const ok = valeur >= minimum
  if (!ok) echecs++
  process.stdout.write(`${ok ? 'ok ' : 'KO '} ${p.texte} sur ${p.fond} : ${valeur.toFixed(2)}:1 (minimum ${minimum}) · ${p.usage}\n`)
}
// Les couleurs d'aplat ne doivent pas servir de texte sur fond clair : on le rappelle en chiffres.
for (const t of ['red', 'green'] as const) for (const f of ['wall', 'poster'] as const) process.stdout.write(`    ${t} sur ${f} : ${contraste(couleurs[t], couleurs[f]).toFixed(2)}:1, interdit en texte\n`)
if (echecs) {
  process.stderr.write(`${echecs} paire(s) sous le minimum\n`)
  process.exit(1)
}
process.stdout.write(`${PAIRES.length} paires vérifiées\n`)
