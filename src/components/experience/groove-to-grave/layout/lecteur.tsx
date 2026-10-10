'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, type CSSProperties } from 'react'
import { PRESETS } from '../content'
import { label } from '../content/label'
import type { Preset } from '../content/types'
import { onTick } from '../lib/ticker'
import { routes } from '../lib/routes'
import { moteur } from '../audio/moteur'
import { avanceRapide, basculer, chercher, compteSorties, definirCatalogue, definirFeuille, definirMenu, definirMini, definirPreset, precedent, regler, stop, suivant, useLecteur, type PisteJouable } from '../store/lecteur-store'
import BandeDefilante, { texteBande } from '../ui/bande-defilante'
import FenetreCassette from '../ui/fenetre-cassette'
import IconePlay, { Icone } from '../ui/icone-play'
import { Monogramme } from '../ui/logos/logo'
import Spectre from '../ui/spectre'
import NavLiens from './nav-liens'

interface LecteurProps {
  catalogue: PisteJouable[]
  /** Prochaine soirée pour la bande, ou l'état « aucune date ». */
  prochaine: string
}

function mmss(s: number): string {
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/**
 * Le lecteur, dans le layout donc persistant. Desktop : skin collant en haut, 112 px au plus,
 * deux rangées (titre et navigation ; transport, fenêtre cassette, afficheur, presets, volume),
 * mode mini sur une rangée et une ligne fine. Mobile : barre du haut de 56 px avec le menu en
 * plein écran, barre de lecture en bas de 64 px qui se déplie en feuille. Sans JavaScript, le
 * CSS ne montre que la barre de titre, la navigation et le lien Bandcamp (classes g2g-js).
 */
export default function Lecteur({ catalogue, prochaine }: LecteurProps) {
  const etat = useLecteur()
  const pathname = usePathname()
  const router = useRouter()
  const precedentChemin = useRef(pathname)
  const feuilleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    definirCatalogue(catalogue)
  }, [catalogue])

  // Changement de page : avance rapide sonore, la musique est abaissée puis remontée, jamais coupée.
  useEffect(() => {
    if (precedentChemin.current !== pathname) {
      precedentChemin.current = pathname
      avanceRapide()
      definirMenu(false)
    }
  }, [pathname])

  // Pleurage de démarrage : la vitesse de bande remonte de 0,72 à 1 en 0,5 s après chaque lancement.
  useEffect(() => {
    if (etat.statut !== 'lecture') return
    return onTick(() => {
      moteur().pleurer()
    })
  }, [etat.statut, etat.piste?.id])

  // Feuille ou menu ouverts : le reste de la page est inerte et ne défile pas.
  useEffect(() => {
    const ouvert = etat.feuille || etat.menu
    document.documentElement.classList.toggle('g2g-verrou', ouvert)
    const main = document.getElementById('contenu')
    if (main) main.inert = ouvert
    if (ouvert) feuilleRef.current?.querySelector<HTMLElement>('button, a')?.focus()
    return () => {
      document.documentElement.classList.remove('g2g-verrou')
      if (main) main.inert = false
    }
  }, [etat.feuille, etat.menu])

  const surSorties = pathname === routes.sorties
  const choisirPreset = (p: Preset) => {
    definirPreset(p)
    if (surSorties) router.replace(p === 'tout' ? routes.sorties : `${routes.sorties}?genre=${p}`, { scroll: false })
  }

  const joue = etat.statut === 'lecture'
  const duree = etat.piste?.duration ?? 0
  const annonce = `${etat.annonce}${etat.piste ? '' : ` ${texteBande(etat, prochaine)}`}`

  const transport = (
    <div className="g2g-transport" role="group" aria-label="Transport">
      <button type="button" className="g2g-rond" data-g2g="precedent" aria-label="Piste précédente" onClick={precedent} disabled={!catalogue.length}>
        <Icone nom="precedent" />
      </button>
      <button type="button" className="g2g-rond g2g-rond--grand" data-g2g="lecture" aria-label={joue ? 'Pause' : 'Lecture'} onClick={() => basculer()} disabled={!catalogue.length}>
        <IconePlay pause={joue} />
      </button>
      <button type="button" className="g2g-rond" data-g2g="suivant" aria-label="Piste suivante" onClick={suivant} disabled={!catalogue.length}>
        <Icone nom="suivant" />
      </button>
      <button type="button" className="g2g-rond" data-g2g="stop" aria-label="Stop" onClick={stop} disabled={etat.statut === 'vide'}>
        <Icone nom="stop" />
      </button>
    </div>
  )

  const compteurs = (
    <dl className="g2g-compteurs g2g-lcd-texte">
      <div>
        <dt>SORTIES</dt>
        <dd>{String(compteSorties(etat.preset)).padStart(2, '0')}</dd>
      </div>
      <div>
        <dt>PISTE</dt>
        <dd>{etat.piste ? etat.piste.position : '--'}</dd>
      </div>
      <div className="g2g-compteurs__temps">
        <dt>TEMPS</dt>
        <dd>
          {mmss(etat.position)}
          <span className="g2g-compteurs__duree"> / {mmss(duree)}</span>
        </dd>
      </div>
    </dl>
  )

  const presets = (
    <div className="g2g-presets" role="group" aria-label="Presets : égalisation et filtre du catalogue">
      {PRESETS.map((p) => (
        <button key={p} type="button" data-g2g={`preset-${p}`} aria-pressed={etat.preset === p} onClick={() => choisirPreset(p)}>
          {p.toUpperCase()}
        </button>
      ))}
    </div>
  )

  const volume = (
    <div className="g2g-volume">
      <button type="button" className="g2g-rond g2g-rond--petit" aria-label={etat.muet ? 'Réactiver le son' : 'Couper le son'} aria-pressed={etat.muet} onClick={() => regler({ muet: !etat.muet })}>
        <Icone nom={etat.muet ? 'muet' : 'volume'} />
      </button>
      <label>
        <span className="g2g-cache">Volume</span>
        <input type="range" className="g2g-curseur" min={0} max={100} step={1} value={Math.round(etat.volume * 100)} onChange={(e) => regler({ volume: Number(e.target.value) / 100 })} style={{ '--pc': `${Math.round(etat.volume * 100)}%` } as CSSProperties} />
      </label>
    </div>
  )

  const progression = (
    <label className="g2g-progression">
      <span className="g2g-cache">Position dans l’extrait</span>
      <input type="range" className="g2g-curseur" min={0} max={Math.max(1, Math.round(duree))} step={1} value={Math.min(Math.round(etat.position), Math.round(duree))} disabled={!etat.piste} onChange={(e) => chercher(Number(e.target.value))} style={{ '--pc': `${duree ? (etat.position / duree) * 100 : 0}%` } as CSSProperties} />
    </label>
  )

  return (
    <header className={`g2g-lecteur${etat.mini ? ' g2g-lecteur--mini' : ''}${etat.feuille ? ' g2g-lecteur--feuille' : ''}${etat.menu ? ' g2g-lecteur--menu' : ''}`} data-statut={etat.statut}>
      <div className="g2g-cache" aria-live="polite" aria-atomic="true">
        {annonce}
      </div>

      {/* Rangée 1 : monogramme et nom, navigation, mention, mini. Barre du haut sur mobile. */}
      <div className="g2g-lecteur__r1">
        <Link href={routes.accueil} className="g2g-lecteur__nom" aria-label={`${label.nom}, accueil`}>
          <Monogramme className="g2g-lecteur__mono" />
          <span aria-hidden="true">
            <span>Groove To Grave</span>
            <span>Records</span>
          </span>
        </Link>
        <nav aria-label="Navigation principale" className="g2g-nav g2g-lecteur__nav" id="g2g-navigation">
          <NavLiens />
        </nav>
        <span className="g2g-tampon g2g-lecteur__concept">concept non officiel</span>
        <button type="button" className="g2g-rond g2g-rond--petit g2g-js g2g-lecteur__mini" data-g2g="mini" aria-pressed={etat.mini} aria-label={etat.mini ? 'Agrandir le lecteur' : 'Passer en mode mini'} onClick={() => definirMini(!etat.mini)}>
          <Icone nom={etat.mini ? 'agrandir' : 'mini'} />
        </button>
        <button type="button" className="g2g-rond g2g-rond--petit g2g-js g2g-lecteur__menu-bouton" data-g2g="menu" aria-expanded={etat.menu} aria-controls="g2g-navigation" aria-label={etat.menu ? 'Fermer le menu' : 'Menu'} onClick={() => definirMenu(!etat.menu)}>
          <Icone nom={etat.menu ? 'fermer' : 'menu'} />
        </button>
      </div>

      {/* Rangée 2 (desktop) : transport, fenêtre cassette, afficheur (bande, spectre et compteurs, presets) puis progression, volume. */}
      <div className="g2g-lecteur__r2 g2g-js">
        {transport}
        <FenetreCassette className="g2g-lecteur__fenetre" />
        <div className="g2g-lecteur__centre">
          <div className="g2g-lecteur__afficheur g2g-lcd">
            <BandeDefilante prochaine={prochaine} />
            <div className="g2g-lecteur__bas">
              <Spectre />
              {compteurs}
            </div>
            {presets}
          </div>
          {progression}
        </div>
        {volume}
      </div>

      {/* Ligne fine du mode mini : bande, fenêtre, lecture. */}
      <div className="g2g-lecteur__fine g2g-js">
        <FenetreCassette className="g2g-lecteur__fenetre g2g-lecteur__fenetre--mini" />
        <div className="g2g-lcd g2g-lecteur__afficheur-mini">
          <BandeDefilante prochaine={prochaine} />
        </div>
        <button type="button" className="g2g-rond" data-g2g="lecture-mini" aria-label={joue ? 'Pause' : 'Lecture'} onClick={() => basculer()} disabled={!catalogue.length}>
          <IconePlay pause={joue} />
        </button>
      </div>

      {/* Barre de lecture mobile, en bas, 64 px au-dessus de la zone de sécurité ; se déplie en feuille. */}
      <div className="g2g-barre g2g-js">
        <FenetreCassette className="g2g-lecteur__fenetre g2g-lecteur__fenetre--barre" />
        <div className="g2g-lcd g2g-barre__bande">
          <BandeDefilante prochaine={prochaine} />
        </div>
        <button type="button" className="g2g-rond" data-g2g="lecture-barre" aria-label={joue ? 'Pause' : 'Lecture'} onClick={() => basculer()} disabled={!catalogue.length}>
          <IconePlay pause={joue} />
        </button>
        <button type="button" className="g2g-rond g2g-rond--petit" data-g2g="deplier" aria-expanded={etat.feuille} aria-controls="g2g-feuille" aria-label={etat.feuille ? 'Replier le lecteur' : 'Déplier le lecteur'} onClick={() => definirFeuille(!etat.feuille)}>
          <Icone nom={etat.feuille ? 'replier' : 'deplier'} />
        </button>
      </div>
      <div className="g2g-feuille g2g-js" id="g2g-feuille" ref={feuilleRef} role="dialog" aria-label="Lecteur" aria-modal="true" hidden={!etat.feuille}>
        <div className="g2g-feuille__entete">
          <FenetreCassette className="g2g-lecteur__fenetre" />
          <button type="button" className="g2g-rond g2g-rond--petit" data-g2g="replier" aria-label="Replier le lecteur" onClick={() => definirFeuille(false)}>
            <Icone nom="replier" />
          </button>
        </div>
        <div className="g2g-lcd g2g-feuille__afficheur">
          <BandeDefilante prochaine={prochaine} />
          <div className="g2g-lecteur__bas">
            <Spectre />
            {compteurs}
          </div>
          {progression}
        </div>
        {presets}
        {transport}
        {volume}
      </div>

      {/* Menu mobile en plein écran : la même navigation, grandes cibles. */}
      <div className="g2g-menu g2g-js" hidden={!etat.menu}>
        <nav aria-label="Navigation principale" className="g2g-menu__nav">
          <NavLiens />
        </nav>
      </div>

      {/* Sans JavaScript : barre statique avec le lien Bandcamp. */}
      <div className="g2g-lecteur__statique g2g-sans-js">
        <span>Le lecteur a besoin de JavaScript.</span>
        <a href={label.reseaux[0].url} rel="noopener">
          Écouter sur Bandcamp
        </a>
      </div>
    </header>
  )
}
