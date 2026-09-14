'use client'

import { useState } from 'react'
import styles from './salon.module.css'
import { UI } from '../entre-nous/content'
import type { Question } from '../entre-nous/types'
import type { Lien } from './use-lien'

/**
 * Le jeu, à ce stade : UNE mécanique câblée de bout en bout.
 *
 * Seule la bascule est branchée, volontairement. On valide la chaîne complète
 * — saisie, écriture versionnée, attente, révélation par les deux côtés — sur
 * le cas le plus simple avant d'y faire passer les six autres.
 *
 * La question arrive en prop : le déroulé est calculé une seule fois, plus
 * haut. Le serveur ne transmet jamais les questions, seulement l'index — les
 * deux clients les recalculent depuis la graine de la salle.
 */
export default function Jeu({ lien, question }: { lien: Lien; question: Question }) {
  const { etat, cote, etatQuestion, revelations, miennes } = lien
  const [refus, setRefus] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  if (!etat || !cote) return null

  const phase = etatQuestion(question.id)
  const revelation = revelations[question.id]
  const options = question.options ?? []
  const nomDe = (c: 'a' | 'b') => etat.places.find((p) => p.cote === c)?.nom ?? c
  const lisible = (v: unknown) => (typeof v === 'string' ? v : v === null ? '—' : String(v))

  const repondre = async (valeur: string) => {
    setRefus(null)
    setEnvoi(true)
    const r = await lien.repondre(question.id, valeur, etat.index)
    setEnvoi(false)
    if ('refus' in (r as object)) {
      // Une réponse perdue se dit. L'avaler en silence est le bug que
      // l'utilisateur ne comprendra jamais.
      setRefus('Cette question est passée pendant que tu répondais.')
    }
  }

  if (question.mecanique !== 'bascule') {
    return (
      <>
        <p className={styles.sous}>question {etat.index + 1}</p>
        <p className={styles.question}>{question.texte}</p>
        <p className={styles.sous}>
          Mécanique « {question.mecanique} » — pas encore branchée à distance.
        </p>
      </>
    )
  }

  return (
    <>
      <p className={styles.sous}>question {etat.index + 1}</p>
      <p className={styles.question}>{question.texte}</p>

      {phase === 'saisie' && (
        <div className={styles.choix}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              className={styles.btn}
              disabled={envoi}
              onClick={() => void repondre(o)}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {phase === 'attente' && (
        <>
          <p className={styles.attente}>{UI.jeu.attente}</p>
          <p className={styles.sous}>tu as répondu « {lisible(miennes[question.id])} »</p>
        </>
      )}

      {/* En vol : la ligne s'éclaire, et on n'écrit rien. */}
      {phase === 'en-vol' && <p className={styles.sous}>&nbsp;</p>}

      {phase === 'revelee' && revelation && (
        <div className={styles.rev}>
          {(['a', 'b'] as const).map((c) => {
            const r = c === 'a' ? revelation.a : revelation.b
            return (
              <div key={c} className={styles.revLigne}>
                <span className={styles.revNom}>
                  {nomDe(c)}
                  {c === cote ? ' · toi' : ''}
                </span>
                <span className={styles.revVal}>
                  {r?.passe ? UI.jeu.passee : lisible(r?.valeur)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {refus !== null && <p className={styles.passee}>{refus}</p>}
    </>
  )
}
