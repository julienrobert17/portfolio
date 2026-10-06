import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
