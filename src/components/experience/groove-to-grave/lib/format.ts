/** Formats d'affichage : dates en français, durées mm:ss. */

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

/** « 9 janvier 2026 » depuis une date ISO, sans fuseau (date civile). */
export function dateLongue(iso: string): string {
  const [a, m, j] = iso.split('-').map(Number)
  return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`
}

/** « ven. 9 janv. 2026 » court, pour les bandes de cassette et les flyers. */
export function dateCourte(iso: string): string {
  const [a, m, j] = iso.split('-').map(Number)
  const jour = JOURS[new Date(Date.UTC(a, m - 1, j)).getUTCDay()]
  return `${jour.slice(0, 3)}. ${j} ${MOIS[m - 1].slice(0, 4)}. ${a}`
}

/** « 09.01.26 » pour la bande d'une cassette de soirée. */
export function dateBande(iso: string): string {
  const [a, m, j] = iso.split('-')
  return `${j}.${m}.${a.slice(2)}`
}

export function annee(iso: string): number {
  return Number(iso.slice(0, 4))
}

/** « 7:49 » depuis des secondes. */
export function duree(secondes: number): string {
  const m = Math.floor(secondes / 60)
  const s = Math.round(secondes % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Durée totale d'une liste de pistes, « 25 min ». */
export function dureeTotale(secondes: number): string {
  return `${Math.round(secondes / 60)} min`
}
