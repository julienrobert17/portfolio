import Link from 'next/link'
import { label, textes } from '../content/label'
import type { Soiree } from '../content/types'
import { dateLongue } from '../lib/format'
import { routes } from '../lib/routes'
import { SupportFlyer, nomSoiree } from '../ui/flyer'

interface HerosProps {
  prochaine: Soiree | undefined
  /** Sur l'accueil, un lien vers la page soirées ; sur la page soirées, rien. */
  lienToutes?: boolean
}

/**
 * La soirée à venir en héros : son flyer en grand s'il existe, date, lieu, line-up et
 * billetterie à côté. Sans date annoncée, l'état vide soigné (newsletter et Instagram).
 */
export default function HerosSoiree({ prochaine, lienToutes }: HerosProps) {
  if (!prochaine) {
    return (
      <div className="g2g-vide">
        <p className="g2g-marqueur">{textes.soireesVide.body}</p>
        <p>Aucune date n’est annoncée publiquement pour l’instant. Les prochaines sorties et soirées passent d’abord par Instagram et la newsletter.</p>
        <ul className="g2g-liens">
          <li>
            <a href={label.reseaux[2].url} rel="noopener">
              Instagram du label
            </a>
          </li>
          <li>
            <Link href={`${routes.contact}#newsletter`}>Newsletter</Link>
          </li>
        </ul>
      </div>
    )
  }
  return (
    <div className="g2g-heros">
      <SupportFlyer soiree={prochaine} sizes="(max-width: 860px) 100vw, 760px" priority />
      <div className="g2g-heros__texte">
        <p className="g2g-meta">Prochaine soirée</p>
        <p className="g2g-affiche g2g-heros__date">
          <time dateTime={prochaine.date}>{dateLongue(prochaine.date)}</time>
        </p>
        <p>
          <strong>{nomSoiree(prochaine)}</strong>
          {prochaine.hours ? `, ${prochaine.hours}` : ''}
        </p>
        <p>
          {prochaine.venue}
          {prochaine.address ? `, ${prochaine.address}` : ''}
        </p>
        {prochaine.lineup.length ? <p>{prochaine.lineup.join(' · ')}</p> : null}
        <ul className="g2g-liens" style={{ marginTop: 0 }}>
          {prochaine.ticketing ? (
            <li>
              <a href={prochaine.ticketing} rel="noopener" className="g2g-bouton--principal">
                {prochaine.price ? `Billetterie, ${prochaine.price.toLowerCase()}` : 'Billetterie'}
              </a>
            </li>
          ) : null}
          {lienToutes ? (
            <li>
              <Link href={routes.soirees}>Toutes les soirées</Link>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
