# Portfolio — CLAUDE.md

## Règles de travail (économie)
- Glob/Grep pour localiser ; lire un fichier entier seulement pour le modifier.
- Jamais lire node_modules, .next, public/ (lister les noms au plus), ni les lockfiles.
- Pas de résumé du code lu, pas de ré-explication. Réponses courtes, en français.
- Aucune nouvelle dépendance sans demander d'abord, en une ligne. Aucun refactor hors périmètre.
- Avant chaque commit : `npx tsc --noEmit` et `npm run lint` (pas `npm run build` sauf demande).
- Un commit par tâche, message en français, concis. Pas de `any`, pas de `console.log`.
- Jamais `text-zinc-*`/`border-zinc-*`/`bg-zinc-*` → `text-foreground`, `text-muted-foreground`, `border-border`, `bg-background`.
- Ne pas créer de fichiers dans src/app sans demander. Secrets (DATABASE_URL) jamais côté client.
- Next 16 ≠ docs connues : voir AGENTS.md et node_modules/next/dist/docs/ en cas de doute d'API.

## Stack constatée
- Next 16.2.6 App Router (src/app, pas de pages/), React 19.2, TypeScript strict, alias `@/*` → src/*.
- Tailwind v4 via `@theme inline` dans globals.css (pas de tailwind.config). CSS modules seulement dans src/components/experience/*.
- Prisma + PostgreSQL Neon (adapter pg). Modèles : Project, Experience, Salle, Participant, Reponse, Evenement.
- Animations maison (keyframes CSS, reveal, scroll-controller). gsap installé mais inutilisé. 3D : three + @react-three/fiber/drei/postprocessing.
- Pas de lib UI, pas de framer-motion, pas de Prettier. ESLint 9 flat config.

## Arborescence utile
- src/app/layout.tsx — layout racine unique, metadata globale, polices Geist/Geist_Mono/Plus_Jakarta_Sans, monte CustomCursor et ConditionalHeader
- src/app/globals.css — variables couleur, @theme, keyframes fadeFlip/slideUp/slideInRight
- src/app/page.tsx — home ; routes : /contact, /lab, /projects/[slug] (pas d'index /projects), /games/geodatle, /experience/{entre-nous,entre-nous-a-distance,prototaxites,un-moment-hors-du-temps}
- src/app/api/ — contact, owid, countries, entre-nous/{reponses,flux,action,salle}
- src/components/layout/ — header.tsx, conditional-header.tsx (masqué sur /games/*)
- src/components/home/ — hero-section, rotating-strokes, scroll-controller, featured-projects, experiences-section
- src/components/ui/ — custom-cursor, reveal, typewriter
- src/components/projects/ — project-grid, project-filters (non importés actuellement)
- src/components/games/geodatle/ — jeu Geodatle (inline styles dark, pas Tailwind)
- src/components/experience/ — une expérience par dossier, code nommé en français
- src/lib/data.ts — requêtes Prisma projets/expériences ; src/lib/prisma.ts — client ; src/lib/i18n.ts — FR/EN
- prisma/schema.prisma, prisma/seed.ts — schéma et seed ; scripts/generate-countries.mjs — données pays
- RAPPORT_GRAPHISME.md — direction artistique

## Conventions et couleurs
- Fichiers kebab-case, composants PascalCase, dossiers par feature. Server Components par défaut, 'use client' si nécessaire. Prisma uniquement côté serveur.
- Variables : --background #ffffff / #0a0a0a (dark), --foreground #171717 / #ededed, --page-padding clamp(32px,6vw,100px) ; @theme : --color-background, --color-foreground, --font-sans, --font-mono. Geodatle : vert #15803d, jaune #ca8a04, rouge #c2410c, rouge foncé #b91c1c.
- Dev : `npm run dev`. Déploiement Vercel, build `npx prisma generate && npm run build`.
