import Link from 'next/link'
import { label } from '../content/label'
import { PRESETS, type Preset } from '../content'
import { NAV, routes } from '../lib/routes'
import { Monogramme } from '../ui/logos/logo'
import NavLiens from './nav-liens'

interface SkinProps {
  /** Nombre de sorties du filtre courant, compteur SORTIES. */
  sorties: number
  preset?: Preset
}

/**
 * Le lecteur en version statique, rendue par le serveur et complète sans JavaScript : barre
 * de titre avec le monogramme, barre de menu (la navigation principale), afficheur figé
 * (bande, compteurs, presets en liens de filtre) et un lien « écouter sur Bandcamp ». Le
 * moteur audio et le transport s'ajoutent par-dessus en Phase 3.
 */
export default function SkinStatique({ sorties, preset = 'tout' }: SkinProps) {
  return (
    <header className="g2g-skin">
      <div className="g2g-skin__titre">
        <Link href={routes.accueil} className="g2g-skin__nom" aria-label={`${label.nom}, accueil`}>
          <Monogramme className="g2g-skin__mono" />
          <span aria-hidden="true">
            <span>Groove To Grave</span>
            <span>Records</span>
          </span>
        </Link>
        <span className="g2g-skin__concept">concept non officiel</span>
      </div>
      <nav aria-label="Navigation principale" className="g2g-nav">
        <NavLiens />
      </nav>
      <div className="g2g-lcd g2g-lcd-texte">
        <div className="g2g-lcd__bande" aria-hidden="true" title="Groove To Grave Records · Paris · insère une cassette">
          GROOVE TO GRAVE RECORDS · PARIS · INSÈRE UNE CASSETTE · DU SILLON À LA TOMBE ···
        </div>
        <div className="g2g-lcd__ligne">
          <dl className="g2g-lcd__compteurs">
            <div className="g2g-lcd__compteur">
              <dt>SORTIES</dt>
              <dd>{String(sorties).padStart(2, '0')}</dd>
            </div>
            <div className="g2g-lcd__compteur">
              <dt>PISTE</dt>
              <dd>--</dd>
            </div>
            <div className="g2g-lcd__compteur g2g-lcd__compteur--temps">
              <dt>TEMPS</dt>
              <dd>00:00</dd>
            </div>
          </dl>
          <ul className="g2g-presets" aria-label="Presets : filtre du catalogue">
            {PRESETS.map((p) => (
              <li key={p}>
                <Link href={p === 'tout' ? routes.sorties : `${routes.sorties}?genre=${p}`} aria-current={p === preset ? 'true' : undefined}>
                  {p.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="g2g-skin__statique">
        <span>Le lecteur arrive avec le son.</span>
        <a href={label.reseaux[0].url} rel="noopener">
          Écouter sur Bandcamp
        </a>
        <span className="g2g-cache">{NAV.length} entrées de navigation</span>
      </div>
    </header>
  )
}
