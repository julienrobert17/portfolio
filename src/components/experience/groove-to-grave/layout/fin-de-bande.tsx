import Link from 'next/link'
import { chargerContenu } from '../sanity/contenu'
import { routes } from '../lib/routes'
import BoutonRembobiner from '../ui/bouton-rembobiner'
import { Crane } from '../ui/logos/logo'
import SentinelleFin from './sentinelle-fin'

/**
 * Pied de page « fin de bande », gardé par le crâne : crédit du site, droits des œuvres,
 * sources, réseaux du label, et « rembobiner » qui ramène en haut de page (ancre,
 * avec le son de rembobinage quand le lecteur est là). Sa sentinelle prévient le lecteur quand
 * il entre dans l'écran : l'afficheur passe en FIN DE BANDE.
 */
export default async function FinDeBande() {
  const { label, textes } = await chargerContenu()
  return (
    <footer className="g2g-fin" id="fin-de-bande">
      <SentinelleFin />
      <div className="g2g-fin__int">
        <Crane className="g2g-fin__crane" />
        <div className="g2g-fin__corps">
          <h2 className="g2g-affiche g2g-titre-page">Fin de bande</h2>
          <p>{textes.credits.body}</p>
          <p>
            {textes.droits.body} Textes marqués « brouillon » en attente de validation par le label. <Link href={routes.sources}>Sources et crédits</Link>.
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
            <BoutonRembobiner />
          </p>
        </div>
      </div>
    </footer>
  )
}
