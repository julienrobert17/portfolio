import type { Soiree } from '../content/types'
import { styleRotation } from '../lib/desordre'
import { dateLongue } from '../lib/format'
import { lieuAffiche } from '../lib/registre'
import Photo from './photo'

/** Nom affiché d'une soirée : le sien, sinon celui du label. Jamais fabriqué à partir du lieu. */
export function nomSoiree(s: Soiree): string {
  return s.name ?? 'Groove To Grave Records'
}

/** Support poster collé au scotch : le flyer réel jamais recadré, ou l'affiche typographique. */
export function SupportFlyer({ soiree, sizes = '(max-width: 600px) 100vw, 400px', priority }: { soiree: Soiree; sizes?: string; priority?: boolean }) {
  return (
    <figure className="g2g-flyer__support" style={styleRotation(soiree.date, 2)}>
      {soiree.flyer ? (
        <Photo image={soiree.flyer} alt={`Visuel de la soirée ${nomSoiree(soiree)}, ${dateLongue(soiree.date)}`} sizes={sizes} priority={priority} />
      ) : (
        <div className="g2g-affiche-date">
          <span className="g2g-affiche">
            <time dateTime={soiree.date}>{dateLongue(soiree.date)}</time>
          </span>
          <span className="g2g-affiche g2g-affiche--lieu">{lieuAffiche(soiree.venue)}</span>
          <span className="g2g-meta">visuel non retrouvé</span>
        </div>
      )}
      {soiree.flyerCredit ? <figcaption className="g2g-meta">Visuel : {soiree.flyerCredit}</figcaption> : null}
    </figure>
  )
}

/**
 * Flyer d'archive : support poster, rotation de 2° au plus sur le support entier ; date,
 * lieu et line-up en texte à côté, mentions annulée ou reportée.
 */
export default function Flyer({ soiree }: { soiree: Soiree }) {
  const mention = soiree.status === 'annulee' ? 'Annulée' : soiree.status === 'reportee' ? 'Reportée' : null
  return (
    <article className="g2g-flyer" data-collage="">
      <SupportFlyer soiree={soiree} />
      <div className="g2g-flyer__texte">
        <strong>
          <time dateTime={soiree.date}>{dateLongue(soiree.date)}</time>
          {mention ? <span className="g2g-rouge"> · {mention}</span> : null}
        </strong>
        <span>
          {nomSoiree(soiree)}
          {soiree.hours ? `, ${soiree.hours}` : ''}
        </span>
        <span>
          {lieuAffiche(soiree.venue)}
          {soiree.address ? `, ${soiree.address}` : ''}
        </span>
        {soiree.lineup.length ? <span>{soiree.lineup.join(' · ')}</span> : null}
        {soiree.price ? <span className="g2g-meta">{soiree.price}</span> : null}
        {!soiree.verified ? <span className="g2g-meta">Date relevée sans source en ligne</span> : null}
        {soiree.ticketing ? (
          <a href={soiree.ticketing} rel="noopener">
            {soiree.status === 'a-venir' ? 'Billetterie' : 'Page de la soirée'}
          </a>
        ) : null}
      </div>
    </article>
  )
}
