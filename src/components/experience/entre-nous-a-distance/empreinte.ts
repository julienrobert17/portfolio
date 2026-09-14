import { hashSeed } from '@/lib/seeded-random'
import type { RunPlan } from '../entre-nous/types'

/**
 * L'empreinte d'un déroulé.
 *
 * Les questions ne transitent jamais par le serveur : chaque client les
 * recalcule depuis la graine de la salle. Si les deux appareils ne font pas
 * tourner le même code — déploiement pendant la partie, onglet resté ouvert,
 * fichier de questions perso différent — les déroulés divergent EN SILENCE :
 * même index, questions différentes, réponses rangées sous des identifiants
 * qui ne se rencontrent jamais, et plus aucune révélation ne tombe.
 *
 * On empreinte donc le RÉSULTAT, pas une version du code. C'est ce qui fait la
 * différence entre une détection utile et une détection agaçante : retoucher
 * une couleur ne doit pas interdire une partie, reformuler une question si.
 *
 * Les identifiants suffisent : ceux des questions perso sont dérivés de leur
 * texte, donc deux fichiers perso différents donnent déjà des ids différents.
 */
export function empreinteDuDeroule(run: RunPlan): string {
  const signature = run.questions.map((q) => `${q.id}:${q.mecanique}`).join('|')
  return hashSeed(signature).toString(36)
}

/** L'horodatage de construction, figé dans le bundle. */
export const BUILD: string = process.env.NEXT_PUBLIC_BUILD ?? ''
