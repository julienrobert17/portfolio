# Portfolio — Brief Claude Code

## Stack
- Next.js 14 App Router, TypeScript strict
- Tailwind CSS pour le style
- Prisma + PostgreSQL (Neon) pour la DB
- Pas de librairie de composants UI (pas de shadcn, pas de MUI)

## Structure des fichiers
- /src/app → routes Next.js (App Router)
- /src/components → composants réutilisables
- /src/lib → utilitaires, client Prisma, helpers
- /src/types → types TypeScript partagés
- /prisma → schema et migrations

## Conventions de code
- Toujours typer explicitement les props des composants
- Server Components par défaut, 'use client' uniquement si nécessaire
- Les appels Prisma se font dans les Server Components ou les Route Handlers
- Nommer les fichiers en kebab-case, les composants en PascalCase

## Ce qu'il ne faut jamais faire
- Pas de `any`
- Pas de `console.log` (utiliser des commentaires TODO à la place)
- Ne jamais exposer DATABASE_URL ou secrets côté client
- Ne pas créer de fichiers dans /src/app sans me demander d'abord
- **Jamais utiliser text-zinc-*, border-zinc-*, bg-zinc-*** 
  → utiliser text-muted-foreground, border-border, 
  bg-background, text-foreground à la place

## Modèles de données
Voir /prisma/schema.prisma pour la structure complète.

## Objectif du projet
Portfolio personnel avec :
1. Page d'accueil avec présentation
2. Catalogue de projets (filtrable par tags)
3. Page détail par projet
4. Section expériences professionnelles
5. Page contact