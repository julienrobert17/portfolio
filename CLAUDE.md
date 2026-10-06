# Portfolio — CLAUDE.md

## Règles de travail (économie)
- Glob/Grep pour localiser ; lire un fichier entier seulement pour le modifier.
- Jamais lire node_modules, .next, public/ (lister les noms au plus), ni les lockfiles.
- Pas de résumé du code lu, pas de ré-explication. Réponses courtes, en français.
- Aucune nouvelle dépendance sans demander d'abord, en une ligne. Aucun refactor hors périmètre.
- Avant chaque commit : `npx tsc --noEmit` doit passer. Pour le lint, lance `npx eslint <fichiers modifiés>` uniquement sur les fichiers touchés dans la session ; aucune nouvelle erreur n'est tolérée dans ces fichiers, les erreurs préexistantes ailleurs sont hors périmètre et ne doivent pas être corrigées sans demande explicite. Pas `npm run build` sauf demande.
- Un commit par tâche, message en français, concis. Pas de `any`, pas de `console.log`.
- Jamais `text-zinc-*`/`border-zinc-*`/`bg-zinc-*` → `text-foreground`, `text-muted-foreground`, `border-border`, `bg-background`.
- Ne pas créer de fichiers dans src/app sans demander. Secrets (DATABASE_URL) jamais côté client.
- Next 16 ≠ docs connues : voir AGENTS.md et node_modules/next/dist/docs/ en cas de doute d'API.

## Stack constatée
- Next 16.2.6 App Router (src/app, pas de pages/), React 19.2, TypeScript strict, alias `@/*` → src/*.
- Tailwind v4 via `@theme inline` dans globals.css (pas de tailwind.config). CSS modules seulement dans src/components/experience/*.
- Prisma + PostgreSQL Neon (adapter pg). Modèles : Project, Experience, Salle, Participant, Reponse, Evenement.
- Animations maison (keyframes CSS, reveal, scroll-controller). 3D : three + @react-three/fiber/drei/postprocessing. gsap et lenis : utilisés uniquement par La Coupe, ne pas les supprimer.
- Pas de lib UI, pas de framer-motion, pas de Prettier. ESLint 9 flat config.

## Arborescence utile
- src/app/layout.tsx — layout racine, metadata, polices (preload: false), monte CustomCursor, ConditionalHeader, ConditionalFooter, EasterEggs
- src/app/page.tsx — home (ScrollController) ; src/app/not-found.tsx — 404
- src/app/globals.css — @theme Tailwind v4, @property --accent, keyframes, styles cartes / étude de cas / 404
- src/app/projects/[slug]/page.tsx — fiche projet ; étude de cas si content/case-studies/<slug>.md existe
- src/app/experience/ — entre-nous, entre-nous-a-distance, prototaxites, un-moment-hors-du-temps, la-coupe (layout propre, sous-routes atelier/contact/projets/[slug], images OG)
- src/app/games/geodatle/, src/app/contact/, src/app/lab/, src/app/api/ (contact, owid, countries, entre-nous/*)
- src/components/layout/ — header (fond 85 %), footer (compact sur la home), conditional-header/footer via src/lib/routes.ts
- src/components/home/ — hero-section, scroll-controller (3 panneaux, hash, clavier, butées + garde d'intention au retour hero), featured-projects, project-card-video, about-section
- src/components/ui/ — custom-cursor, reveal, typewriter, panel-counter, scroll-progress, easter-eggs
- src/components/projects/ — case-study, case-study-toc ; src/components/not-found/ — corps du 404
- src/components/experience/<slug>/ — une expérience par dossier, code en français ; la-coupe/ utilise GSAP, Lenis, R3F, ViewTransition
- src/components/games/geodatle/ — jeu (inline styles dark, pas Tailwind)
- src/lib/ — data.ts (Prisma), prisma.ts, i18n.ts, accents.ts (--accent par slug), links.ts (URLs), routes.ts (routes immersives), case-studies.ts (fs)
- prisma/schema.prisma, prisma/seed.ts — 7 projets dont 6 featured ; scripts/ — generate-countries.mjs, fetch/generate la-coupe (photos, placeholders, tuile)
- content/case-studies/<slug>.md — études de cas ; public/videos/ — vidéos de cartes ; RAPPORT_GRAPHISME.md — direction artistique

## Conventions et couleurs
- Fichiers kebab-case, composants PascalCase, dossiers par feature. Server Components par défaut, 'use client' si nécessaire. Prisma uniquement côté serveur.
- Variables : --background #ffffff / #0a0a0a (dark), --foreground #171717 / #ededed, --page-padding clamp(32px,6vw,100px) ; @theme : --color-background, --color-foreground, --font-sans, --font-mono. Geodatle : vert #15803d, jaune #ca8a04, rouge #c2410c, rouge foncé #b91c1c.
- Dev : `npm run dev`. Déploiement Vercel, build `npx prisma generate && npm run build`.
