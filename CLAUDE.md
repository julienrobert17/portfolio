# Portfolio — Brief Claude Code

## Stack
- Next.js 16.2.6 App Router, TypeScript strict
- Tailwind CSS pour le style global
- Prisma + PostgreSQL (Neon) pour la DB
- Pas de librairie de composants UI (pas de shadcn, pas de MUI)
- react-simple-maps pour les cartes géographiques

## Structure des fichiers
- /src/app → routes Next.js (App Router)
- /src/components → composants réutilisables
- /src/lib → utilitaires, client Prisma, helpers
- /src/types → types TypeScript partagés
- /prisma → schema et migrations
- /src/lib/i18n.ts → système de traductions FR/EN

## Conventions de code
- Toujours typer explicitement les props des composants
- Server Components par défaut, 'use client' uniquement si nécessaire
- Les appels Prisma se font dans les Server Components ou les Route Handlers
- Nommer les fichiers en kebab-case, les composants en PascalCase
- Inline styles pour le jeu Geodatle (dark theme custom, pas Tailwind)

## Ce qu'il ne faut jamais faire
- Pas de `any`
- Pas de `console.log`
- Ne jamais exposer DATABASE_URL ou secrets côté client
- Ne pas créer de fichiers dans /src/app sans me demander d'abord
- **Jamais utiliser text-zinc-*, border-zinc-*, bg-zinc-***
  → utiliser text-muted-foreground, border-border,
  bg-background, text-foreground à la place
- Ne jamais modifier les fichiers dans /mnt/skills/public (read-only)

## Projet principal — Geodatle
Jeu de géographie quotidien type Wordle.
- Route : /games/geodatle
- Composants : /src/components/games/geodatle/
- Libs : /src/lib/geodatle-data.ts, /src/lib/geodatle-game.ts
- Données : RestCountries API + Our World in Data (CSV)
- Seed quotidien UTC via hashCode(date ISO)
- i18n FR/EN avec détection navigator.language
- Responsive : tableau desktop / grille 2x4 mobile

### Fichiers clés Geodatle
- game-board.tsx → composant principal, split GameBoard/GameBoardInner
- guess-row.tsx → une ligne de résultat (desktop <tr> / mobile <div>)
- world-map.tsx → carte react-simple-maps
- result-screen.tsx → modale résultat avec timer UTC
- rules-modal.tsx → modale règles avec indicateurs
- lang-context.tsx → Context React langue FR/EN

### Système de couleurs Geodatle
- Vert #15803d → similar (≤15% d'écart)
- Jaune/Orange #ca8a04 → close (≤25% d'écart)
- Rouge #c2410c → far (>25% d'écart)
- Rouge foncé #b91c1c → continent faux
- Gris rgba(255,255,255,0.08) → données manquantes

### Emojis indicateurs
- 🌍 Continent, 👥 Population, 🗺️ Superficie
- 🪙 Pauvreté, ❤️ Espérance de vie, 🥩 Viande
- 🌿 CO₂, 👶 Fertilité

## Portfolio principal
- / → Hero avec Typewriter + custom cursor violet
- /projects → filtrage par tags via URL searchParams
- /projects/[slug] → page détail dynamique
- /contact → formulaire avec Route Handler /api/contact
- Header sticky avec ConditionalHeader (masqué sur /games/*)
- Custom cursor désactivé sur /games/*

## APIs internes
- /api/countries → données RestCountries (revalidate 24h)
- /api/owid → données Our World in Data CSV (revalidate 24h)
- /api/contact → envoi formulaire contact

## Déploiement
- GitHub : julienrobert17/portfolio
- Vercel : portfolio-eight-sable-66.vercel.app
- Build command : npx prisma generate && npm run build
- Variable d'env requise : DATABASE_URL (Neon)

## État actuel (juin 2026)

### Fait
- Portfolio complet (home, projets, contact)
- Geodatle entièrement fonctionnel avec responsive mobile
- Système i18n FR/EN
- Modale règles + timer compte à rebours UTC
- Persistance localStorage (état de la partie)
- Mode debug (?debug=true)
- Migration RestCountries → JSON statique (World Bank + world-countries npm)
- Script scripts/generate-countries.mjs pour regénérer les données
- Séparation Amériques Nord/Sud via subregion mledoze
- Carte monde responsive basée sur hauteur avec ResizeObserver
- Légende indicateurs dans modale règles
- Custom cursor désactivé sur /games/*
- Bouton ? fixe mobile (bottom-right)
- Labels indicateurs permanents sur toutes les lignes mobile

### En cours / À faire
- Home page : animations scroll-driven (texte qui vole, 
  révélation au scroll, section réalisations en cards)
- Expérience Three.js standalone orientée impact écologique/social
  (paysage montagne nuit + sphères navigables — mis de côté)
- Valider comportement scroll/focus input mobile