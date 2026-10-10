import type { Soiree } from '../content/types'
import { styleRotation } from '../lib/desordre'
import { dateLongue } from '../lib/format'
import Photo, { aPhoto } from './photo'

/**
 * Flyer réel collé au scotch sur un support poster, jamais recadré, rotation de 2° au plus sur
 * le support entier ; date, lieu et line-up en texte à côté. Sans flyer récupéré, une affiche
 * texte dans le même cadre. Le scotch est décoratif (pseudo-éléments).
 */
export default function Flyer({ soiree }: { soiree: Soiree }) {
  const titre = soiree.name ?? `Groove To Grave à ${soiree.venue}`
  const mention = soiree.status === 'annulee' ? 'Annulée' : soiree.status === 'reportee' ? 'Reportée' : null
  return (
    <article className="g2g-flyer">
      <figure className="g2g-flyer__support" style={styleRotation(soiree.date, 2)}>
        {aPhoto(soiree.date) ? (
          <Photo id={soiree.date} alt={`Visuel de la soirée ${titre}, ${dateLongue(soiree.date)}`} sizes="(max-width: 600px) 100vw, 420px" />
        ) : (
          <div className="g2g-flyer__affiche">
            <span className="g2g-affiche">{titre}</span>
            <small className="g2g-meta">{dateLongue(soiree.date)}</small>
          </div>
        )}
        {soiree.flyerCredit ? <figcaption className="g2g-meta">Visuel : {soiree.flyerCredit}</figcaption> : null}
      </figure>
      <div className="g2g-flyer__texte">
        <strong>
          <time dateTime={soiree.date}>{dateLongue(soiree.date)}</time>
          {mention ? <span className="g2g-rouge"> · {mention}</span> : null}
        </strong>
        <span>
          {titre}
          {soiree.hours ? `, ${soiree.hours}` : ''}
        </span>
        <span>
          {soiree.venue}
          {soiree.address ? `, ${soiree.address}` : ''}
        </span>
        {soiree.lineup.length ? <span>{soiree.lineup.join(' · ')}</span> : null}
        {soiree.price ? <span className="g2g-meta">{soiree.price}</span> : null}
        {!soiree.verified ? <span className="g2g-meta">Date à confirmer par le label</span> : null}
        {soiree.ticketing ? (
          <a href={soiree.ticketing} rel="noopener">
            {soiree.status === 'a-venir' ? 'Billetterie' : 'Page de la soirée'}
          </a>
        ) : null}
      </div>
    </article>
  )
}
