import { site } from '../content/site'
import Apparition from '../ui/apparition'
import ContactComposeur from './contact-composeur'
import ContactSection from './contact-section'

/**
 * « Écrire » : la phrase à compléter, amélioration progressive d'un simple
 * lien mailto. Sans JavaScript, la feuille du <noscript> échange le bouton du
 * sujet contre sa valeur par défaut en texte et retire le bouton de copie ; il
 * reste la phrase et son lien, qui fonctionnent tels quels.
 */
export default function ContactEcrire() {
  const { composeur } = site.contact
  return (
    <ContactSection numero="01" titre={composeur.titre} large>
      <noscript>
        <style>{'[data-js-seul]{display:none!important}[data-sans-js]{display:inline!important}'}</style>
      </noscript>
      <Apparition bloc>
        <ContactComposeur />
      </Apparition>
    </ContactSection>
  )
}
