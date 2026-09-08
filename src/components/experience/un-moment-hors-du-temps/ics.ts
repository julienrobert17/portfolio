/**
 * Génération d'un fichier .ics conforme RFC 5545, sans aucune dépendance.
 * Tout le contenu textuel vient de l'appelant : ce module ne connaît aucun texte.
 */

export interface IcsEvent {
  title: string
  description: string
  location?: string
  /** Début, en heure LOCALE (l'objet Date est lu via ses getters locaux). */
  start: Date
  durationMinutes: number
  /** Graine pour un UID stable et reproductible. */
  uidSeed: string
}

/** Séparateur de ligne imposé par la RFC 5545. */
const CRLF = '\r\n'

/** Domaine arbitraire pour suffixer l'UID. */
const UID_DOMAIN = 'hors-du-temps.local'

/** Longueur maximale d'une ligne, en OCTETS, hors CRLF. */
const MAX_LINE_BYTES = 75

/** Complète un nombre avec des zéros à gauche. */
function pad(value: number, size = 2): string {
  return String(Math.abs(value)).padStart(size, '0')
}

/** Taille en octets d'un point de code une fois encodé en UTF-8. */
function utf8Size(codePoint: number): number {
  if (codePoint < 0x80) return 1
  if (codePoint < 0x800) return 2
  if (codePoint < 0x10000) return 3
  return 4
}

/**
 * Échappement RFC 5545 des valeurs texte.
 * L'antislash doit impérativement être traité en premier.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Pliage des lignes à 75 octets (et non 75 caractères).
 * On itère par point de code pour ne jamais couper une séquence UTF-8
 * (accents, emojis, paires de substitution).
 */
function foldLine(line: string): string {
  const chunks: string[] = []
  let current = ''
  // La première ligne dispose de 75 octets ; les suivantes de 74 + l'espace de continuation.
  let bytes = 0

  for (const char of line) {
    const size = utf8Size(char.codePointAt(0) ?? 0)
    if (bytes + size > MAX_LINE_BYTES) {
      chunks.push(current)
      current = ''
      bytes = 1 // l'espace de continuation compte pour un octet
    }
    current += char
    bytes += size
  }
  chunks.push(current)

  return chunks.join(`${CRLF} `)
}

/** Date/heure UTC : YYYYMMDDTHHMMSSZ. */
function formatUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

/**
 * Date/heure LOCALE flottante : YYYYMMDDTHHMMSS, sans Z ni TZID.
 * Volontaire : l'événement tombe à l'heure affichée quel que soit le fuseau
 * de l'appareil qui importe le fichier.
 */
function formatFloatingLocal(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

/** Hash simple (variante djb2) pour un UID stable et reproductible. */
function hashSeed(seed: string): string {
  let hash = 5381
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(i)
    hash |= 0 // reste sur 32 bits signés
  }
  const unsigned = hash >>> 0
  return `${unsigned.toString(36)}${pad(seed.length, 3)}`
}

/** Construit le contenu complet du fichier .ics. */
export function buildIcs(event: IcsEvent): string {
  const start = new Date(event.start.getTime())
  const end = new Date(start.getTime() + event.durationMinutes * 60_000)

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//un moment hors du temps//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${hashSeed(event.uidSeed)}@${UID_DOMAIN}`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatFloatingLocal(start)}`,
    `DTEND:${formatFloatingLocal(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
  ]

  if (event.location !== undefined && event.location !== '') {
    lines.push(`LOCATION:${escapeText(event.location)}`)
  }

  lines.push(
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT2H',
    `DESCRIPTION:${escapeText(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  )

  // CRLF partout, y compris en fin de fichier.
  return `${lines.map(foldLine).join(CRLF)}${CRLF}`
}

/** Déclenche le téléchargement du fichier .ics (compatible Safari iOS). */
export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  // Safari iOS exige que le noeud soit dans le document avant le clic.
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  // Laisse le temps au navigateur de récupérer le blob avant révocation.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
