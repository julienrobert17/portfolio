import { label, textes } from '../content/label'
import { inscrireNewsletter } from './newsletter-action'

interface NewsletterProps {
  /** Retour de la server action lu dans l'URL (`?newsletter=merci|invalide`). */
  etat?: string
  /** Chemin de la page qui porte le formulaire, pour y revenir après la server action. */
  retour: string
}

/**
 * Newsletter : le formulaire passe par une server action qui valide l'adresse et n'enregistre
 * rien tant qu'aucun fournisseur n'est choisi avec le label ; le message le dit. Fonctionne
 * sans JavaScript (redirection avec l'état dans l'URL). « Suivre sur Bandcamp » fonctionne.
 */
export default function Newsletter({ etat, retour }: NewsletterProps) {
  return (
    <section className="g2g-section" aria-labelledby="newsletter">
      <h2 id="newsletter" className="g2g-affiche g2g-titre-section">
        Reste branché
      </h2>
      <form action={inscrireNewsletter} className="g2g-form">
        <input type="hidden" name="retour" value={retour} />
        <label htmlFor="newsletter-email">Ton adresse e-mail</label>
        <input id="newsletter-email" name="email" type="email" autoComplete="email" required placeholder="toi@exemple.fr" />
        <button type="submit" className="g2g-bouton g2g-bouton--principal">
          M’inscrire
        </button>
      </form>
      {etat === 'merci' ? (
        <p className="g2g-message" role="status">
          {textes.newsletter.body}
        </p>
      ) : etat === 'invalide' ? (
        <p className="g2g-message" role="alert">
          Cette adresse n’a pas l’air valide. Vérifie-la et réessaie.
        </p>
      ) : null}
      <ul className="g2g-liens">
        <li>
          <a href={label.reseaux[0].url} rel="noopener">
            Suivre sur Bandcamp
          </a>
        </li>
      </ul>
    </section>
  )
}
