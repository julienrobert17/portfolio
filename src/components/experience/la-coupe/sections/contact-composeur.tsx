'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { site } from '../content/site'
import styles from './contact-composeur.module.css'

type Copie = 'repos' | 'copie' | 'echec'

/** Durée d'affichage du retour de copie, en millisecondes. */
const RETOUR = 2400

const { email, composeur } = site.contact

/** Sujet et corps du message pour un type de projet (ou aucun) et un nom (ou vide). */
function composer(typeId: string | null, nom: string): { sujet: string; corps: string[] } {
  const type = composeur.types.find((t) => t.id === typeId) ?? composeur.defaut
  const signature = nom.trim()
  const corps = [composeur.phrase.replace('{objet}', type.objet)]
  if (signature) corps.push(signature)
  return { sujet: type.sujet, corps }
}

/** Lien mailto : paragraphes séparés par une ligne vide, fins de ligne CRLF (RFC 6068). */
function versMailto(sujet: string, corps: string[]): string {
  return `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps.join('\r\n\r\n'))}`
}

/**
 * Composeur sans backend : quatre types de projet (boutons radio) et un nom
 * construisent en direct le lien mailto, sujet et corps préremplis. Le HTML
 * servi porte déjà le lien complet (message par défaut) : sans JavaScript, la
 * section masque les contrôles inertes et il reste un mailto qui fonctionne.
 * Rien ne bouge à la saisie : hauteurs de l'aperçu et du retour réservées.
 */
export default function ContactComposeur() {
  const id = useId()
  const [type, setType] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [copie, setCopie] = useState<Copie>('repos')
  const minuteur = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (minuteur.current !== null) window.clearTimeout(minuteur.current)
    },
    [],
  )

  const { sujet, corps } = composer(type, nom)
  const href = versMailto(sujet, corps)
  const signature = nom.trim()

  const copier = async () => {
    let resultat: Copie = 'copie'
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      resultat = 'echec'
    }
    setCopie(resultat)
    if (minuteur.current !== null) window.clearTimeout(minuteur.current)
    minuteur.current = window.setTimeout(() => setCopie('repos'), RETOUR)
  }

  /** Entrée dans le champ nom : ouvre le message, comme le lien. */
  const envoyer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.location.href = href
  }

  return (
    <form className={styles.composeur} onSubmit={envoyer}>
      <div className={styles.controles} data-composeur-controles>
        <fieldset className={styles.types}>
          <legend className={`lc-mono lc-muted ${styles.legende}`}>{composeur.legende}</legend>
          <div className={styles.pills}>
            {composeur.types.map((t) => (
              <label key={t.id} className={styles.pill}>
                <input
                  type="radio"
                  name="type"
                  value={t.id}
                  checked={type === t.id}
                  onChange={() => setType(t.id)}
                  className={styles.radio}
                />
                <span className={`lc-mono ${styles.pillTexte}`}>{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.champ}>
          <label htmlFor={`${id}-nom`} className={`lc-mono lc-muted ${styles.legende}`}>
            {composeur.nom}
          </label>
          <input
            id={`${id}-nom`}
            name="nom"
            type="text"
            autoComplete="name"
            maxLength={80}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={styles.saisie}
          />
        </div>
      </div>

      <div className={styles.message}>
        <div className={`lc-mono ${styles.apercu}`} role="group" aria-label={composeur.apercu.titre}>
          <p className={styles.entete}>
            <span className="lc-muted">{composeur.apercu.a}</span>
            <span className={styles.valeur}>{email}</span>
          </p>
          <p className={styles.entete}>
            <span className="lc-muted">{composeur.apercu.objet}</span>
            <span className={styles.valeur}>{sujet}</span>
          </p>
          <p className={styles.phrase}>{corps[0]}</p>
          {/* Ligne toujours présente, sur une seule ligne : la signature ne pousse rien. */}
          <p className={`${styles.signature} ${signature ? '' : 'lc-muted'}`} aria-hidden={signature ? undefined : true}>
            {signature || composeur.apercu.signature}
          </p>
        </div>
        <div className={styles.actions}>
          <a href={href} className={`lc-mono ${styles.ouvrir}`} data-magnetique>
            {composeur.ouvrir}
            <span aria-hidden="true"> →</span>
          </a>
          <button type="button" onClick={copier} className={`lc-mono ${styles.copier}`} data-etat={copie} data-composeur-controles>
            {composeur.copier}
          </button>
          <p role="status" aria-live="polite" className={`lc-mono ${styles.retour}`} data-etat={copie}>
            {copie === 'copie' ? composeur.copie : copie === 'echec' ? composeur.echec : ''}
          </p>
        </div>
      </div>
    </form>
  )
}
