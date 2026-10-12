import type { NextConfig } from "next";

const PROJET_SANITY = process.env.SANITY_PROJECT_ID ?? 'da2plce8'
const DATASET_SANITY = process.env.SANITY_DATASET ?? 'production'

const nextConfig: NextConfig = {
  /*
   * Groove To Grave, bloc 7.4b : avec G2G_MEDIAS_MEME_ORIGINE=1, les fichiers médias du CDN
   * Sanity (images optimisées, extraits) sont servis sous notre propre origine, pour que le
   * document et ses médias partagent une seule connexion (voir lib/medias.ts).
   */
  async rewrites() {
    return [
      {
        source: '/experience/groove-to-grave/media/:chemin*',
        destination: `https://cdn.sanity.io/files/${PROJET_SANITY}/${DATASET_SANITY}/:chemin*`,
      },
    ]
  },
  // Les études de cas sont lues avec fs à la demande : il faut les embarquer
  // dans la fonction serverless de la page projet.
  outputFileTracingIncludes: {
    '/projects/[slug]': ['./content/case-studies/**/*'],
  },
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
