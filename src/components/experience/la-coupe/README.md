# La Coupe

Site de démonstration d'un atelier d'architecture, construit comme une coupe :
le scroll traverse l'œuvre. Identité placeholder (Atelier Mireille Vasseur),
huit projets fictifs, images SVG générées.

Routes : `/experience/la-coupe`, `/projets`, `/projets/[slug]`, `/atelier`, `/contact`
(toutes préfixées par `/experience/la-coupe`).

## Lancer

```bash
npm run dev
# puis http://localhost:3000/experience/la-coupe
```

## Contenu

Tout le contenu est dans `content/` et rien d'autre ne porte de texte :

```
content/site.ts        identité, nav, manifeste, chiffres, contact, footer, images hors projets
content/projets.ts     les huit projets (fiche, images, descripteurs plan/coupe)
content/atelier.ts     page atelier : textes, méthode, équipe, distinctions
content/types.ts       types partagés
```

Les `*mots entre astérisques*` passent en italique serif (`ui/rich-text.tsx`).

Les images sont déclarées par ratio et alt ; les fichiers sont générés :

```bash
npx tsx scripts/generate-la-coupe-placeholders.ts
```

Pour passer aux vraies photos : remplacer les fichiers dans
`public/experience/la-coupe/img/` en gardant les noms, ou changer `lib/images.ts`
(un seul endroit) pour pointer vers `next/image`.

## Dessins

`lib/dessins.ts` transforme un descripteur en mètres (emprise, refends,
niveaux, toit, vide) en géométrie SVG. `ui/dessin-svg.tsx` le rend avec des
traits à largeur constante et des cotes en HTML pour garder une taille de texte
fixe. Les traits marqués `tardif` (cotes, hachures, escalier) seront tracés en
dernier au scroll (Phase 3).

## Maquette

`canvas/maquette.ts` décrit le projet phare en volumes (mètres). Le rendu
isométrique statique (`canvas/maquette-statique.tsx`) sert de placeholder et
de repli sans WebGL. `HAUTEUR_COUPE` en dérive : c'est la seule source de la
cote du hero. `loadModel()` est le point d'entrée pour un futur `.glb`.

## Styles

`styles/la-coupe.css` : tokens (`--paper`, `--ink`, `--accent`…), typographie,
grille 12 colonnes, tout posé sur la racine `.lc`, jamais sur `:root`.
Le reste en CSS Modules à côté de chaque composant. Aucune classe Tailwind.

Contrastes vérifiés : `--ink-2` sur `--paper` 6,2 ; `--accent` sur `--paper` 4,8 ;
`--accent` sur `--paper-2` 4,3 (grands textes seulement) ; `--ink-2-inverse`
sur `--ink` 7,0.

## Phases

- [x] Phase 1 — site statique navigable, sans animation
- [ ] Phase 2 — hero R3F, plan de coupe au scroll, cote animée
- [ ] Phase 3 — révélations, sticky stacking, dessins tracés, index animé
- [ ] Phase 4 — menu, transitions de page (`layout/page-transition.tsx`), curseur, préchargeur
- [ ] Phase 5 — Lighthouse, clavier, reduced motion, navigateurs
