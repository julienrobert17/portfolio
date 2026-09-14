import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
