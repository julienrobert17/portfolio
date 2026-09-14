'use client'

import styles from '../entre-nous.module.css'
import { UI } from '../content'

/**
 * La mécanique sans écran.
 *
 * Il n'y a rien à saisir : la question est posée, les deux personnes se
 * parlent, puis chacune touche « c'est dit » de son côté. C'est la seule
 * mécanique dont le but est qu'on lève les yeux du téléphone, donc elle
 * n'affiche ni minuteur, ni compte à rebours, ni compteur — rien qui presse.
 *
 * Le seul minuteur du dispositif est invisible et vit dans le CSS : le bouton
 * de validation arrive en fondu sur cinq secondes (`.btnRetenu`). Il reste
 * cliquable et atteignable au clavier pendant tout le fondu, donc il ne bloque
 * personne ; il retient juste le geste réflexe de valider avant d'avoir parlé.
 */
export default function AVoixHaute() {
  return <p className={styles.consigne}>{UI.jeu.aVoixHaute}</p>
}
