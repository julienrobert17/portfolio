import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF d'abord, WebP en repli : les photos de « la Coupe » passent par l'optimiseur.
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Transitions de page de l'expérience « la Coupe » (React <ViewTransition>).
    // Sans effet ailleurs tant qu'aucun composant ViewTransition n'est rendu.
    viewTransition: true,
  },
};

export default nextConfig;
