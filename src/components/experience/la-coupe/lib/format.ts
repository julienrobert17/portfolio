const NBSP = '\u00A0'
const FINE = '\u202F'

/** 2400 → « 2 400 m² », avec espaces insécables. */
export function formatSurface(m2: number): string {
  return `${m2.toLocaleString('fr-FR').replace(/\s/g, FINE)}${NBSP}m²`
}

export function formatNumero(index: number): string {
  return String(index + 1).padStart(2, '0')
}

/** 48.8318, 2.3474 → « 48.8318° N, 2.3522° E ». */
export function formatGps(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${NBSP}${ns}, ${Math.abs(lon).toFixed(4)}°${NBSP}${ew}`
}

export function anneesDepuis(annee: number, maintenant = new Date()): number {
  return maintenant.getFullYear() - annee
}
