import Link from 'next/link'
import { label, textes } from '../content/label'
import type { Soiree } from '../content/types'
import { dateLongue } from '../lib/format'
import { routes } from '../lib/routes'

/** Prochaine soirée ou état vide, sur l'accueil et sur la page soirées. */
export default function BlocSoirees({ prochaine, titre = true }: { prochaine: Soiree | undefined; titre?: boolean }) {
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
    <div className="g2g-vide">
      {titre ? <p className="g2g-meta">Prochaine soirée</p> : null}
      <p className="g2g-affiche g2g-titre">
        <time dateTime={prochaine.date}>{dateLongue(prochaine.date)}</time>
      </p>
      <p>
        <strong>{prochaine.name ?? `Groove To Grave à ${prochaine.venue}`}</strong>
        {prochaine.hours ? `, ${prochaine.hours}` : ''}. {prochaine.venue}
        {prochaine.address ? `, ${prochaine.address}` : ''}.
      </p>
      {prochaine.lineup.length ? <p>{prochaine.lineup.join(' · ')}</p> : null}
      <ul className="g2g-liens">
        {prochaine.ticketing ? (
          <li>
            <a href={prochaine.ticketing} rel="noopener" className="g2g-bouton--rouge">
              {prochaine.price ? `Billetterie, ${prochaine.price.toLowerCase()}` : 'Billetterie'}
            </a>
          </li>
        ) : null}
        <li>
          <Link href={routes.soirees}>Toutes les soirées</Link>
        </li>
      </ul>
    </div>
  )
}
