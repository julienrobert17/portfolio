import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF d'abord, WebP en repli : les photos de « la Coupe » passent par l'optimiseur.
    formats: ['image/avif', 'image/webp'],
    // 75 reste le défaut partout ; 60 ne sert qu'aux images de tête de « la Coupe ».
    qualities: [60, 75],
  },
  experimental: {
    // Transitions de page de l'expérience « la Coupe » (React <ViewTransition>).
    // Sans effet ailleurs tant qu'aucun composant ViewTransition n'est rendu.
    viewTransition: true,
  },
};

export default nextConfig;
