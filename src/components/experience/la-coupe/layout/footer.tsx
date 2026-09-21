import { credits } from '../content/credits'
import { projets } from '../content/projets'
import { site } from '../content/site'
import { rendreDessin } from '../lib/dessins'
import { formatGps } from '../lib/format'
import { typo } from '../lib/typo'
import Apparition from '../ui/apparition'
import DessinSvg from '../ui/dessin-svg'
import RevealText from '../ui/reveal-text'
import FooterCta from './footer-cta'
import LocalTime from './local-time'
import styles from './footer.module.css'

/**
 * Pied de page inversé, pleine hauteur. Le dessin de coupe en bas se tracera
 * à l'entrée dans la vue (Phase 3) ; l'email deviendra magnétique (Phase 4).
 */
export default function Footer() {
  const coupe = projets[0].dessins.find((d) => d.type === 'coupe')
  const dessin = coupe ? rendreDessin(coupe, 1400) : null
  const { contact, reseaux, footer } = site
  return (
    <footer className={`lc-container ${styles.footer}`}>
      <FooterCta>
        <div className={styles.cta}>
          <RevealText as="p" className={`lc-display lc-h1 ${styles.titre}`}>
            {contact.cta}
          </RevealText>
          <a href={`mailto:${contact.email}`} className={`lc-display lc-h3 ${styles.email}`} data-magnetique>
            {contact.email}
          </a>
        </div>
      </FooterCta>

      <Apparition className={`lc-grid ${styles.colonnes}`}>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Adresse</h2>
          <address className={styles.adresse}>
            {contact.adresse.map((ligne) => (
              <span key={ligne}>{ligne}</span>
            ))}
            <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className="lc-link">
              {contact.telephone}
            </a>
          </address>
          <p className={`lc-mono ${styles.secondaire}`}>{formatGps(contact.gps.lat, contact.gps.lon)}</p>
        </div>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Réseaux</h2>
          <ul className={styles.liste}>
            {reseaux.map((r) => (
              <li key={r.label}>
                <a href={r.href} className="lc-link" rel="noopener noreferrer" target="_blank">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Mentions</h2>
          <ul className={`${styles.liste} ${styles.secondaire}`}>
            {footer.mentions.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        <div className={styles.colonne}>
          <h2 className={`lc-mono ${styles.intitule}`}>Crédits</h2>
          <ul className={`${styles.liste} ${styles.secondaire}`}>
            {/* Avec des photos téléchargées, la ligne « placeholders » cède la place aux auteurs. */}
            {footer.credits
              .filter((c) => credits.length === 0 || !c.startsWith('Photographies'))
              .map((c) => (
                <li key={c}>{c}</li>
              ))}
          </ul>
          {credits.length > 0 ? (
            <details className={styles.credits}>
              <summary className={styles.creditsResume}>
                {typo(`Photographies : ${credits.length} auteurs, ${[...new Set(credits.map((c) => c.source))].join(' et ')}`)}
              </summary>
              <ul className={`${styles.liste} ${styles.secondaire} ${styles.creditsListe}`}>
                {credits.map((c) => (
                  <li key={c.url}>
                    <a href={c.url} className="lc-link" rel="noopener noreferrer" target="_blank">
                      {c.auteur}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <p className={`lc-mono ${styles.heure}`}>
            <LocalTime />
          </p>
        </div>
      </Apparition>

      {dessin ? (
        <div className={styles.dessin}>
          <DessinSvg dessin={dessin} encre="paper" anime trigger="footer" />
        </div>
      ) : null}

      <p className={`lc-mono ${styles.copyright}`}>
        © {new Date().getFullYear()} {site.nom}
      </p>
    </footer>
  )
}
