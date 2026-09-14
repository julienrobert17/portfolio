/**
 * Le seul point de conversion écran → conteneur de toute l'expérience.
 *
 * En face à face, la moitié du haut est rendue sous `rotate(180deg)` pour se
 * lire depuis l'autre bord du téléphone. Les `PointerEvent` restent, eux, en
 * espace écran : un doigt qui monte à l'écran descend dans le conteneur, et un
 * geste vers la droite va vers la gauche. Sans cette conversion, chaque
 * mécanique gestuelle part à l'envers pour la personne d'en face.
 *
 * Il est volontairement partagé plutôt que recopié dans chaque mécanique :
 * c'est l'endroit du projet où une correction faite à moitié coûterait le plus
 * cher, parce qu'elle ne se voit que sur un seul des deux côtés.
 */
export function versConteneur(
  dx: number,
  dy: number,
  flipped: boolean,
): { dx: number; dy: number } {
  return flipped ? { dx: -dx, dy: -dy } : { dx, dy }
}
