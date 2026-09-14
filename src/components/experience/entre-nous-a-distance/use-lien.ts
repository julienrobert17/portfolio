'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Cote, EtatSalle } from '@/lib/entre-nous-a-distance/types'

const CLE_CLIENT = 'entre-nous-client'
const JOURNAL_MAX = 120
const LATENCES_MAX = 30

/** L'état du lien, tel qu'on le montre. */
export type EtatLien = 'ferme' | 'connexion' | 'ouvert' | 'reprise'

export interface Message {
  a: number
  sens: 'reçu' | 'envoyé'
  type: string
  id?: number
  taille: number
}

export interface InfoLien {
  etat: EtatLien
  transport: string | null
  dernierId: number
  reconnexions: number
  /** Depuis quand on n'a rien reçu, en ms. Diagnostic, pas affichage. */
  silenceMs: number
  /**
   * Depuis quand le lien est en peine, en ms — `null` s'il va bien.
   *
   * C'est une AUTRE horloge que `silenceMs`, et c'est celle qui pilote ce
   * qu'on dit à l'utilisateur. Le silence atteint routinièrement quinze
   * secondes sur un lien parfaitement sain, puisque c'est l'intervalle des
   * battements : s'en servir pour afficher « vérifie le wifi » ferait paniquer
   * une connexion qui va bien.
   */
  panneDepuisMs: number | null
  /** Quand le serveur fermera ce flux. */
  echeance: number | null
  /** Vrai quand le client a coupé lui-même, via le panneau de debug. */
  coupeAlaMain: boolean
}

/**
 * Un identifiant de client qui survit au rafraîchissement.
 *
 * `?client=B` le force. C'est indispensable pour travailler : deux onglets de
 * la même machine partagent `localStorage`, donc le même identifiant — et le
 * second reprendrait le BAIL du premier au lieu de prendre la seconde place.
 * Le comportement est correct, il rend juste le test à deux onglets
 * impossible sans cette porte.
 */
function clientPersistant(): string {
  try {
    const force = new URLSearchParams(window.location.search).get('client')
    if (force !== null && force.trim() !== '') return `force-${force.trim()}`
  } catch {
    // URL illisible : on retombe sur l'identifiant normal.
  }
  try {
    const existant = localStorage.getItem(CLE_CLIENT)
    if (existant) return existant
    const neuf = crypto.randomUUID()
    localStorage.setItem(CLE_CLIENT, neuf)
    return neuf
  } catch {
    // Navigation privée : on garde un identifiant le temps de l'onglet.
    return crypto.randomUUID()
  }
}

/**
 * Le lien avec le serveur : un flux SSE en lecture, des POST en écriture.
 *
 * Trois choses qui ne sont pas des détails :
 *
 * · Le flux meurt tout seul au bout de quelques minutes. On se reconnecte
 *   AVANT l'échéance annoncée à l'ouverture, pour que la reprise soit un
 *   geste et pas un accident. `EventSource` sait se reconnecter seul, mais
 *   seulement après avoir échoué — c'est-à-dire trop tard.
 *
 * · `Last-Event-ID` est renvoyé par le navigateur tout seul, mais uniquement
 *   sur SA reconnexion automatique. Quand c'est nous qui rouvrons, il faut le
 *   passer à la main : d'où `depuis` dans l'URL.
 *
 * · L'état affiché ne vient JAMAIS d'une déduction locale. Un client ne
 *   conclut pas « on a tous les deux validé » : il l'apprend.
 */
export function useLien() {
  const [clientId] = useState(clientPersistant)
  const [etat, setEtat] = useState<EtatSalle | null>(null)
  const [cote, setCote] = useState<Cote | null>(null)
  const [lien, setLien] = useState<InfoLien>({
    etat: 'ferme',
    transport: null,
    dernierId: 0,
    reconnexions: 0,
    silenceMs: 0,
    panneDepuisMs: null,
    echeance: null,
    coupeAlaMain: false,
  })
  const [journal, setJournal] = useState<Message[]>([])
  const [latences, setLatences] = useState<number[]>([])
  const [conflits, setConflits] = useState(0)

  const sourceRef = useRef<EventSource | null>(null)
  /** Quand le lien a cessé d'être ouvert. 0 = il va bien. */
  const panneDepuisRef = useRef(0)
  const dernierIdRef = useRef(0)
  /** 0 tant que rien n'est arrivé : `Date.now()` pendant le rendu est impur. */
  const dernierRecuRef = useRef(0)
  const codeRef = useRef<string | null>(null)
  const coupeRef = useRef(false)
  const reprogrammeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const noter = useCallback((m: Omit<Message, 'a'>) => {
    setJournal((j) => [{ a: Date.now(), ...m }, ...j].slice(0, JOURNAL_MAX))
  }, [])

  const fermer = useCallback(() => {
    sourceRef.current?.close()
    sourceRef.current = null
    if (reprogrammeRef.current !== null) clearTimeout(reprogrammeRef.current)
    reprogrammeRef.current = null
  }, [])

  /**
   * `ouvrir` se reprogramme lui-même avant l'échéance du flux. Il ne peut pas
   * se nommer dans son propre `useCallback` — d'où ce relais, qui pointe
   * toujours sur la dernière version.
   */
  const ouvrirRef = useRef<((code: string) => void) | null>(null)

  const ouvrir = useCallback(
    (code: string) => {
      fermer()
      dernierRecuRef.current = Date.now()
      codeRef.current = code
      if (panneDepuisRef.current === 0) panneDepuisRef.current = Date.now()
      setLien((l) => ({ ...l, etat: 'connexion', coupeAlaMain: false }))
      coupeRef.current = false

      const url = `/api/entre-nous/flux?salle=${encodeURIComponent(code)}&client=${encodeURIComponent(clientId)}&depuis=${dernierIdRef.current}`
      const source = new EventSource(url)
      sourceRef.current = source

      const surEvenement = (type: string) => (e: MessageEvent<string>) => {
        dernierRecuRef.current = Date.now()
        const charge: unknown = e.data ? JSON.parse(e.data) : null
        const id = e.lastEventId ? Number(e.lastEventId) : undefined
        if (id !== undefined && Number.isFinite(id) && id > dernierIdRef.current) {
          dernierIdRef.current = id
          // La ref sert à la reprise, l'état sert à l'affichage : sans cette
          // ligne le panneau montre 0 en permanence, c'est-à-dire qu'il ment
          // sur le seul chiffre qui explique la reprise incrémentale.
          setLien((l) => (l.dernierId === id ? l : { ...l, dernierId: id }))
        }
        noter({ sens: 'reçu', type, id, taille: e.data?.length ?? 0 })

        if (type === 'bienvenue') {
          const b = charge as { transport: string; echeance: number; margeMs: number }
          panneDepuisRef.current = 0
          setLien((l) => ({
            ...l,
            etat: 'ouvert',
            panneDepuisMs: null,
            transport: b.transport,
            echeance: b.echeance,
          }))
          // On rouvre AVANT que le serveur ne ferme : une reprise choisie
          // plutôt qu'une coupure subie.
          const dans = Math.max(2000, b.echeance - Date.now() - 2000)
          if (reprogrammeRef.current !== null) clearTimeout(reprogrammeRef.current)
          reprogrammeRef.current = setTimeout(() => {
            if (coupeRef.current) return
            setLien((l) => ({ ...l, etat: 'reprise', reconnexions: l.reconnexions + 1 }))
            ouvrirRef.current?.(code)
          }, dans)
          return
        }
        if (type === 'instantane') {
          setEtat(charge as EtatSalle)
          return
        }
        if (type === 'phase' || type === 'participant' || type === 'index') {
          // On ne recompose pas l'état à la main : on redemande la vérité.
          void rafraichir(code)
        }
      }

      for (const type of [
        'bienvenue',
        'instantane',
        'participant',
        'phase',
        'index',
        'reponse',
        'revelation',
        'battement',
        'fin',
      ]) {
        source.addEventListener(type, surEvenement(type) as EventListener)
      }

      source.onerror = () => {
        if (coupeRef.current) return
        if (panneDepuisRef.current === 0) panneDepuisRef.current = Date.now()
        setLien((l) => ({ ...l, etat: 'reprise', reconnexions: l.reconnexions + 1 }))
        noter({ sens: 'reçu', type: 'erreur-flux', taille: 0 })
      }

      async function rafraichir(codeSalle: string) {
        const r = await fetch(
          `/api/entre-nous/salle?code=${encodeURIComponent(codeSalle)}`,
        ).catch(() => null)
        if (r?.ok) setEtat((await r.json()) as EtatSalle)
      }
    },
    [clientId, fermer, noter],
  )

  useEffect(() => {
    ouvrirRef.current = ouvrir
  }, [ouvrir])

  /**
   * DEUX HORLOGES, ET IL FAUT QU'ELLES LE RESTENT.
   *
   * `silenceMs` — depuis quand rien n'est arrivé. Elle monte en permanence sur
   * un lien parfaitement sain, puisque le serveur n'envoie un battement que
   * toutes les quinze secondes. Elle sert au diagnostic, dans le panneau.
   *
   * `panneDepuisMs` — depuis quand le lien n'est plus ouvert. Elle vaut `null`
   * quand tout va bien. C'est ELLE, et elle seule, qui décide de ce qu'on dit
   * à l'utilisateur.
   *
   * Les confondre est le bug que ce code a déjà eu : la note « vérifie le
   * wifi » se déclenchait au bout de quatre secondes sur une connexion
   * impeccable, simplement parce que le dernier battement datait. Si un jour
   * vous êtes tenté de n'en garder qu'une, c'est que vous avez oublié que le
   * silence est normal et que la panne ne l'est pas.
   */
  useEffect(() => {
    const t = setInterval(() => {
      const depuis = dernierRecuRef.current
      const panne = panneDepuisRef.current
      setLien((l) => ({
        ...l,
        silenceMs: depuis === 0 ? 0 : Date.now() - depuis,
        panneDepuisMs: panne === 0 ? null : Date.now() - panne,
      }))
    }, 500)
    return () => clearInterval(t)
  }, [])

  /** Un retour d'arrière-plan ne se rattrape pas en incrémental. */
  useEffect(() => {
    const surVisibilite = () => {
      if (document.visibilityState !== 'visible') return
      if (coupeRef.current || codeRef.current === null) return
      if (dernierRecuRef.current !== 0 && Date.now() - dernierRecuRef.current < 5000) return
      setLien((l) => ({ ...l, etat: 'reprise', reconnexions: l.reconnexions + 1 }))
      ouvrir(codeRef.current)
    }
    document.addEventListener('visibilitychange', surVisibilite)
    return () => document.removeEventListener('visibilitychange', surVisibilite)
  }, [ouvrir])

  useEffect(() => () => fermer(), [fermer])

  const entrer = useCallback(
    async (nom: string, code?: string) => {
      const r = await fetch('/api/entre-nous/salle', {
        method: code ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nom, clientId, ...(code ? { code } : {}) }),
      })
      const charge = (await r.json()) as { etat?: EtatSalle; cote?: Cote; message?: string }
      noter({ sens: 'envoyé', type: code ? 'rejoindre' : 'creer', taille: 0 })
      if (!r.ok || !charge.etat) return { erreur: charge.message ?? 'Échec.' }
      setEtat(charge.etat)
      setCote(charge.cote ?? null)
      dernierIdRef.current = 0
      ouvrir(charge.etat.code)
      return { etat: charge.etat }
    },
    [clientId, noter, ouvrir],
  )

  /** Une écriture versionnée. `versionForcee` sert à provoquer un conflit. */
  const agir = useCallback(
    async (action: string, charge?: object, versionForcee?: number) => {
      if (!etat) return { erreur: 'pas de salle' }
      const envoiA = performance.now()
      const version = versionForcee ?? etat.version
      noter({ sens: 'envoyé', type: action, taille: JSON.stringify(charge ?? {}).length })
      const r = await fetch('/api/entre-nous/action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: etat.code, clientId, version, action, charge }),
      })
      const ms = Math.round(performance.now() - envoiA)
      setLatences((l) => [ms, ...l].slice(0, LATENCES_MAX))
      const corps = (await r.json()) as { etat?: EtatSalle; conflit?: true; courante?: number }
      if (r.status === 409 && corps.etat) {
        setConflits((c) => c + 1)
        setEtat(corps.etat)
        noter({ sens: 'reçu', type: `conflit→${corps.courante}`, taille: 0 })
        return { conflit: true as const, etat: corps.etat }
      }
      if (corps.etat) setEtat(corps.etat)
      return { etat: corps.etat }
    },
    [clientId, etat, noter],
  )

  /** Les leviers du panneau de debug : provoquer les pannes au lieu de les attendre. */
  const provoquer = {
    couper: useCallback(() => {
      coupeRef.current = true
      fermer()
      panneDepuisRef.current = Date.now()
      setLien((l) => ({ ...l, etat: 'ferme', coupeAlaMain: true, panneDepuisMs: 0 }))
    }, [fermer]),
    rouvrir: useCallback(() => {
      if (codeRef.current) {
        coupeRef.current = false
        setLien((l) => ({ ...l, reconnexions: l.reconnexions + 1 }))
        ouvrir(codeRef.current)
      }
    }, [ouvrir]),
    perimer: useCallback(() => agir('ping', {}, (etat?.version ?? 1) - 1), [agir, etat]),
    resync: useCallback(() => {
      dernierIdRef.current = 0
      if (codeRef.current) ouvrir(codeRef.current)
    }, [ouvrir]),
  }

  return { clientId, etat, cote, lien, journal, latences, conflits, entrer, agir, provoquer }
}

export type Lien = ReturnType<typeof useLien>
