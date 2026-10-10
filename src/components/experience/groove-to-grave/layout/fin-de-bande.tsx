import Link from 'next/link'
import { label, textes } from '../content/label'
import { routes } from '../lib/routes'
import { Crane } from '../ui/logos/logo'

/**
 * Pied de page « fin de bande », gardé par le crâne : crédits du site, mention concept non
 * officiel, sources, réseaux du label, et « rembobiner » qui ramène en haut de page (ancre,
 * sans JavaScript ; le son de rembobinage arrive en Phase 3).
 */
export default function FinDeBande() {
  return (
    <footer className="g2g-fin" id="fin-de-bande">
      <div className="g2g-fin__int">
        <Crane className="g2g-fin__crane" />
        <div>
          <h2 className="g2g-affiche g2g-fin__titre">Fin de bande</h2>
          <p>{textes.conceptNonOfficiel.body}</p>
          <p>
            Site réalisé par Julien Robert, {new Date().getFullYear()}. Faits et visuels relevés sur les pages publiques du label ; textes de notre main marqués « brouillon », à valider par le label.{' '}
            <Link href={routes.label}>Sources et crédits</Link>.
          </p>
          <ul className="g2g-fin__liens" aria-label="Le label en ligne">
            {label.reseaux.map((l) => (
              <li key={l.url}>
                <a href={l.url} rel="noopener">
                  {l.label}
                </a>
              </li>
            ))}
            {label.disquaires.slice(0, 2).map((l) => (
              <li key={l.url}>
                <a href={l.url} rel="noopener">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="g2g-fin__rembobiner">
            <a href="#haut" className="g2g-bouton g2g-bouton--rouge">
              Rembobiner
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
