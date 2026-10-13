import type { Soiree } from '../content/types'
import { styleRotation } from '../lib/desordre'
import { dateLongue } from '../lib/format'
import { composerSoiree, ligneSoiree } from '../lib/soiree'
import Photo from './photo'

/** Support poster collé au scotch : le flyer réel jamais recadré, ou l'affiche typographique. */
export function SupportFlyer({ soiree, sizes = '(max-width: 600px) 100vw, 400px', priority }: { soiree: Soiree; sizes?: string; priority?: boolean }) {
  const { titre, lieu } = composerSoiree(soiree)
  return (
    <figure className="g2g-flyer__support" style={styleRotation(soiree.date, 2)}>
      {soiree.flyer ? (
        <Photo image={soiree.flyer} alt={`Visuel de ${ligneSoiree(soiree)}, ${dateLongue(soiree.date)}`} sizes={sizes} priority={priority} />
      ) : (
        <div className="g2g-affiche-date">
          <span className="g2g-affiche">
            <time dateTime={soiree.date}>{dateLongue(soiree.date)}</time>
          </span>
          <span className="g2g-affiche g2g-affiche--lieu">{lieu || titre}</span>
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
  // Sans flyer, l'affiche typographique imprime déjà le lieu en grand : la ligne de texte ne le répète pas.
  const { titre, lieu, mention } = composerSoiree(soiree, !soiree.flyer)
  return (
    <article className="g2g-flyer" data-collage="" data-soiree={soiree.date} data-lieu={soiree.venue}>
      <SupportFlyer soiree={soiree} />
      <div className="g2g-flyer__texte">
        <strong>
          <time dateTime={soiree.date}>{dateLongue(soiree.date)}</time>
          {mention ? <span className="g2g-rouge"> · {mention.charAt(0).toUpperCase()}{mention.slice(1)}</span> : null}
        </strong>
        <span>
          {titre}
          {soiree.hours ? `, ${soiree.hours}` : ''}
        </span>
        {lieu ? (
          <span>
            {lieu}
            {soiree.address ? `, ${soiree.address}` : ''}
          </span>
        ) : null}
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
