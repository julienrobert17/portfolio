'use client'

import { useEffect, useState } from 'react'
import styles from './panneau.module.css'
import type { Lien } from '../use-lien'

const ETIQUETTES: Record<string, string> = {
  ouvert: 'ouvert',
  connexion: 'connexion…',
  reprise: 'reprise…',
  ferme: 'fermé',
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className={styles.bloc}>
      <p className={styles.titreBloc}>{titre}</p>
      {children}
    </section>
  )
}

function Ligne({ cle, val }: { cle: string; val: React.ReactNode }) {
  return (
    <div className={styles.ligne}>
      <span className={styles.cle}>{cle}</span>
      <span className={styles.val}>{val}</span>
    </div>
  )
}

/**
 * Le panneau de debug.
 *
 * Masqué par défaut, ouvert par `?debug=1` — la convention du dépôt, déjà
 * utilisée par Geodatle. Ce n'est pas un cadran mais un instrument : les
 * boutons du bas PROVOQUENT les quatre modes de panne au lieu de les
 * attendre. C'est la différence entre lire une courbe et comprendre.
 */
interface PanneauProps {
  lien: Lien
  empreinte: string
  fausse: boolean
  setFausse: (v: boolean) => void
}

export default function PanneauDebug({ lien, empreinte, fausse, setFausse }: PanneauProps) {
  const [ouvert, setOuvert] = useState(true)
  const [maintenant, setMaintenant] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const { etat, cote, lien: info, journal, latences, conflits, provoquer, agir, clientId } = lien
  const { retard, setRetard } = lien
  const resteMs = info.echeance !== null && maintenant > 0 ? info.echeance - maintenant : null
  const pire = Math.max(1, ...latences)

  return (
    <aside className={styles.panneau}>
      <button type="button" className={styles.poignee} onClick={() => setOuvert((o) => !o)}>
        <span>
          <span className={`${styles.pastille} ${styles[info.etat]}`} />
          debug · {ETIQUETTES[info.etat]} · {info.transport ?? '—'}
        </span>
        <span>{ouvert ? '▾' : '▸'}</span>
      </button>

      {ouvert && (
        <div className={styles.corps}>
          <Bloc titre="lien">
            <Ligne cle="état" val={ETIQUETTES[info.etat]} />
            <Ligne cle="transport" val={info.transport ?? '—'} />
            <Ligne cle="dernier id reçu" val={info.dernierId} />
            <Ligne cle="reconnexions" val={info.reconnexions} />
            <Ligne cle="silence" val={`${(info.silenceMs / 1000).toFixed(1)} s`} />
            <Ligne
              cle="en panne depuis"
              val={info.panneDepuisMs === null ? '—' : `${(info.panneDepuisMs / 1000).toFixed(1)} s`}
            />
            <Ligne cle="écran" val={info.enVeille ? 'ÉTEINT' : 'allumé'} />
            <Ligne
              cle="ferme le flux dans"
              val={resteMs === null ? '—' : `${Math.max(0, Math.round(resteMs / 1000))} s`}
            />
          </Bloc>

          <Bloc titre="salle">
            <Ligne cle="code" val={etat?.code ?? '—'} />
            <Ligne cle="ma place" val={cote ?? '—'} />
            <Ligne cle="phase" val={etat?.phase ?? '—'} />
            <Ligne cle="version" val={etat?.version ?? '—'} />
            <Ligne cle="conflits de version" val={conflits} />
            <Ligne
              cle="places"
              val={
                etat
                  ? etat.places.map((p) => `${p.cote}:${p.present ? '●' : '○'}`).join(' ') || '—'
                  : '—'
              }
            />
            <Ligne cle="client" val={clientId.slice(0, 8)} />
            <Ligne
              cle="empreinte du déroulé"
              val={fausse ? `${empreinte} → FAUSSÉE` : empreinte}
            />
            <Ligne cle="build" val={(process.env.NEXT_PUBLIC_BUILD ?? '—').slice(11, 19)} />
          </Bloc>

          <Bloc titre={`latence · ${latences[0] ?? '—'} ms`}>
            <div className={styles.barres}>
              {latences
                .slice()
                .reverse()
                .map((ms, i) => (
                  <span
                    key={`${i}-${ms}`}
                    className={styles.barre}
                    style={{ height: `${Math.max(2, (ms / pire) * 100)}%` }}
                    title={`${ms} ms`}
                  />
                ))}
            </div>
          </Bloc>

          <Bloc titre="provoquer une panne">
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.bouton} ${styles.boutonRouge}`}
                onClick={provoquer.couper}
              >
                couper le lien
              </button>
              <button type="button" className={styles.bouton} onClick={provoquer.rouvrir}>
                rouvrir
              </button>
              <button
                type="button"
                className={`${styles.bouton} ${styles.boutonRouge}`}
                onClick={() => void provoquer.perimer()}
              >
                écrire périmé
              </button>
              <button type="button" className={styles.bouton} onClick={provoquer.resync}>
                resync complet
              </button>
              <button type="button" className={styles.bouton} onClick={() => void agir('ping')}>
                ping
              </button>
            </div>
            <div className={styles.actions}>
              {/* Le battement « révélation en vol » dure quelques dizaines de
                  ms : sans ce levier on ne peut pas le regarder. */}
              <button
                type="button"
                className={`${styles.bouton} ${fausse ? styles.boutonRouge : ''}`}
                onClick={() => setFausse(!fausse)}
              >
                {fausse ? 'empreinte faussée ✓' : 'fausser l’empreinte'}
              </button>
            </div>
            <div className={styles.actions}>
              {/* Écran éteint : le chemin nominal du mode, pas une panne. */}
              {[5, 20, 60].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.bouton} ${info.enVeille ? styles.boutonRouge : ''}`}
                  disabled={info.enVeille}
                  onClick={() => provoquer.veille(s * 1000)}
                >
                  écran éteint {s} s
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              {[0, 800, 2500].map((ms) => (
                <button
                  key={ms}
                  type="button"
                  className={`${styles.bouton} ${retard === ms ? styles.boutonRouge : ''}`}
                  onClick={() => setRetard(ms)}
                >
                  {ms === 0 ? 'révélation immédiate' : `retarder ${ms} ms`}
                </button>
              ))}
            </div>
          </Bloc>

          <Bloc titre={`journal · ${journal.length}`}>
            <div className={styles.journal}>
              {journal.map((m, i) => (
                <div key={`${m.a}-${i}`} className={styles.msg}>
                  <span className={styles.horo}>
                    {new Date(m.a).toLocaleTimeString('fr-FR', { hour12: false })}
                  </span>
                  <span className={m.sens === 'reçu' ? styles.recu : styles.envoye}>
                    {m.sens === 'reçu' ? '←' : '→'} {m.type}
                    {m.id !== undefined ? ` #${m.id}` : ''}
                  </span>
                  <span className={styles.taille}>{m.taille}o</span>
                </div>
              ))}
            </div>
          </Bloc>
        </div>
      )}
    </aside>
  )
}
