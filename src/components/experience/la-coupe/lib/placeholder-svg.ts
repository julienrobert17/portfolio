/**
 * Placeholder d'image : dégradé chaud, trame fine type calque, mention du
 * ratio en mono. Pur, sans dépendance : utilisé par le script de génération.
 */
export interface OptionsPlaceholder {
  width: number
  height: number
  ratio: string
  /** Teinte HSL, 0-360. */
  teinte: number
  /** Décale légèrement la lumière d'une image à l'autre d'un même projet. */
  variante?: number
}

export function placeholderSvg({ width, height, ratio, teinte, variante = 0 }: OptionsPlaceholder): string {
  const t1 = (teinte + variante * 7) % 360
  const t2 = (t1 + 22) % 360
  const clair = `hsl(${t1} 24% ${82 - (variante % 3) * 3}%)`
  const sombre = `hsl(${t2} 18% ${60 - (variante % 4) * 2}%)`
  const angle = 35 + (variante % 5) * 11
  const pas = Math.round(width / 16)
  const fontSize = Math.max(14, Math.round(width * 0.013))
  const marge = Math.round(width * 0.02)
  const grille: string[] = []
  for (let x = pas; x < width; x += pas) grille.push(`M${x} 0V${height}`)
  for (let y = pas; y < height; y += pas) grille.push(`M0 ${y}H${width}`)
  const rad = (angle * Math.PI) / 180
  const x2 = Math.round(50 + Math.cos(rad) * 50)
  const y2 = Math.round(50 + Math.sin(rad) * 50)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs>`,
    `<linearGradient id="g" x1="${100 - x2}%" y1="${100 - y2}%" x2="${x2}%" y2="${y2}%"><stop offset="0" stop-color="${clair}"/><stop offset="1" stop-color="${sombre}"/></linearGradient>`,
    `<radialGradient id="h" cx="${20 + (variante % 3) * 25}%" cy="${15 + (variante % 2) * 20}%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
    `</defs>`,
    `<rect width="${width}" height="${height}" fill="url(#g)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#h)"/>`,
    `<path d="${grille.join('')}" stroke="#151412" stroke-opacity="0.06" stroke-width="1" fill="none"/>`,
    `<text x="${width - marge}" y="${height - marge}" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" fill="#151412" fill-opacity="0.42">${ratio}</text>`,
    `</svg>`,
  ].join('')
}
