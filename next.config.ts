import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Groove To Grave : les médias viennent du CDN Sanity. L'option « même origine »
   * (G2G_MEDIAS_MEME_ORIGINE=1) passe par la route src/app/experience/groove-to-grave/media/,
   * et non plus par une réécriture : seule une route permet de refuser la mise en cache des
   * réponses partielles, sans quoi la première sonde `bytes=0-1` d'iOS fige le fichier (bloc 7.5b).
   */
  experimental: {
    // Transitions de page de l'expérience « la Coupe » (React <ViewTransition>).
    // Sans effet ailleurs tant qu'aucun composant ViewTransition n'est rendu.
    viewTransition: true,
  },
  env: {
    /*
     * Horodatage de la construction, figé dans le bundle.
     *
     * Sert uniquement à dire LAQUELLE de deux versions divergentes est la plus
     * ancienne, quand deux appareils n'ont pas le même code. Sans ça, on sait
     * qu'il y a désaccord mais pas qui doit recharger — et on recharge dans le
     * désordre pour retomber dessus.
     */
    NEXT_PUBLIC_BUILD: new Date().toISOString(),
  },
};

export default nextConfig;
