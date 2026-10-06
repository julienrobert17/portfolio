import { imagesAtelier } from '../content/site'
import { imageAtelier } from '../lib/images'
import Photo from '../ui/photo'
import styles from './contact-fermeture.module.css'

/** Fermeture : la photo du plateau, pleine largeur, posée contre le footer. Le cadre fixe le ratio, la photo le remplit. */
export default function ContactFermeture() {
  const image = imageAtelier('atelier', imagesAtelier.atelier)
  return (
    <div className={styles.cadre}>
      <Photo image={image} sizes="100vw" cover />
    </div>
  )
}
