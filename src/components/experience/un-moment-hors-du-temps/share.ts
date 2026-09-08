import { COPY, PERSO } from './content'
import type { Answers } from './use-invitation-machine'
import { formatLong, formatMinutes, fromISODate, hashString } from './dates'

/** Le libellé lisible de l'activité choisie, champ libre compris. */
export function activityLabel(answers: Answers): string {
  const option = COPY.step5.options.find((candidate) => candidate.id === answers.activity)
  if (option) return option.label
  const other = answers.activityOther.trim()
  return other.length > 0 ? other : '—'
}

export function dateLabel(answers: Answers): string {
  return answers.dateISO ? formatLong(fromISODate(answers.dateISO)) : '—'
}

export function timeLabel(answers: Answers): string {
  return answers.minutes === null ? '—' : formatMinutes(answers.minutes)
}

/** Numéro de confirmation absurde, mais stable pour un même jeu de réponses. */
export function confirmationRef(answers: Answers): string {
  const seed = `${answers.dateISO ?? ''}|${answers.minutes ?? ''}|${activityLabel(answers)}`
  const digits = (hashString(seed) % 9000) + 1000
  return `HDT-${digits}-MIAOU`
}

export function shareMessage(answers: Answers): string {
  return COPY.step7.shareMessage
    .replace('{date}', dateLabel(answers))
    .replace('{heure}', timeLabel(answers))
    .replace('{activite}', activityLabel(answers).toLowerCase())
}

/** Lien WhatsApp pré-rempli. wa.me gère l'ouverture app ou web tout seul. */
export function whatsappLink(answers: Answers): string {
  return `https://wa.me/${PERSO.whatsapp}?text=${encodeURIComponent(shareMessage(answers))}`
}

/** Date de début réelle de l'événement, pour l'agenda. */
export function eventStart(answers: Answers): Date | null {
  if (!answers.dateISO || answers.minutes === null) return null
  const date = fromISODate(answers.dateISO)
  date.setHours(Math.floor(answers.minutes / 60), answers.minutes % 60, 0, 0)
  return date
}
