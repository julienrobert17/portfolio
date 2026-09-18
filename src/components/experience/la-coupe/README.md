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

## Maquette et hero 3D

`canvas/maquette.ts` décrit le projet phare en volumes (mètres) : c'est la
source unique du SVG statique, de la scène three et des dessins de la fiche
(`coupeDepuisMaquette`, `planDepuisMaquette`). `HAUTEUR_COUPE` en dérive : la
cote du hero, la coupe de la fiche et celle du footer affichent la même valeur.
`loadModel()` est le point d'entrée pour un futur `.glb`.

```
canvas/projection.ts        azimut 30°, plongée 30°, communs au SVG et à la caméra
canvas/maquette-statique    SVG axonométrique : placeholder, puis repli (coupe à mi-hauteur)
canvas/geometrie.ts         maquette creuse (murs, dalles trouées, refends, toit, escalier), une géométrie fusionnée
canvas/rig.ts               tout l'impératif : plan de coupe, matériaux, caméra, parallaxe
canvas/coupe.tsx            face coupée par stencil (webgl_clipping_stencil), en --accent
canvas/scene.tsx            l'arbre R3F ; prop mode: 'hero' | 'menu' (menu : Phase 4)
canvas/scene-canvas.tsx     le seul <Canvas>, frameloop="never", chargé en import dynamique
canvas/canvas-host.tsx      couche fixe dans le layout : décision, chargement à l'inactivité, rendu à la demande
canvas/garde-canvas.tsx     error boundary → repli statique
sections/hero-scroll.tsx    pin 300vh (220vh tactile), scrub 0.4, cote, fondu du titre, parallaxe
lib/hero-store.ts           état partagé (mode, progression, cadre, souris, sale)
lib/ticker.ts               la seule boucle : gsap.ticker → lenis.raf() et advance()
```

Déroulé : le SVG est affiché au premier rendu ; three se charge après
`requestIdleCallback` ; à la deuxième frame rendue, fondu croisé 600 ms vers
le canvas, cadré sur le repère du SVG (même projection, même largeur). Le hero
est épinglé ; la progression 0 → 1 descend le plan de coupe du faîtage au sol,
tourne la maquette de 20°, recule la caméra de 15 % et efface le titre sur les
20 derniers %. La cote affiche la hauteur au-dessus de laquelle tout est coupé.

Repli (`prefers-reduced-motion`, WebGL absent, échec de chargement, erreur de
scène) : pas de pin, SVG conservé avec le plan de coupe dessiné à mi-hauteur,
cote fixe en `--accent`. En développement, `window.__laCoupeHero` permet de
piloter la progression depuis la console.

## Styles

`styles/la-coupe.css` : tokens (`--paper`, `--ink`, `--accent`…), typographie,
grille 12 colonnes, tout posé sur la racine `.lc`, jamais sur `:root`.
Le reste en CSS Modules à côté de chaque composant. Aucune classe Tailwind.

Contrastes vérifiés : `--ink-2` sur `--paper` 6,2 ; `--accent` sur `--paper` 4,8 ;
`--accent` sur `--paper-2` 4,3 (grands textes seulement) ; `--ink-2-inverse`
sur `--ink` 7,0.

## Mouvement et interactions

`lib/animation.ts` : `useScrollAnimation` (gsap.matchMedia scoppé au composant, rien sous
mouvement réduit, états initiaux posés par GSAP jamais par le CSS), `entree()`, constantes
`ENTREE`. Composants clients minces montés dans les sections serveur (pattern « ancre »).

Transitions (`layout/page-transition.tsx`, contrat dans `layout/transitions/`) : les liens passent
par `LienTransition` → `naviguer()` (`lib/navigation-store.ts`). `partage` : élément partagé par
React `<ViewTransition>` (`ui/partage-image.tsx`, nom `projet-<slug>`, 900 ms) ; `rideau` : couche
maison (`--paper-2`, clip-path par variables CSS, 500 ms, nom de la page) — sous couverture :
lenis.stop, scroll 0, montage, refresh, lenis.start, révélation. Retour navigateur : rideau posé
d'un coup, scroll restauré par Next. Mouvement réduit : fondu 200 ms.

Menu (`layout/menu.tsx`) : deux couches clipées ensemble (fond encre z 59, liens z 62) avec le
canvas entre les deux (z 61) en mode `menu` (fil de fer, un tour / 40 s) ; SVG en repli tant que
three n'a pas rendu. Focus piégé, `main` inerte, Lenis arrêté. Curseur (`ui/curseur.tsx`),
magnétisme (`ui/magnetisme.tsx`, `[data-magnetique]`), préchargeur (`layout/prechargeur.tsx`,
`PRELOADER_ACTIF` dans `lib/prechargeur.ts`), navigation automatique en fin de projet suivant.

## Phases

- [x] Phase 1 — site statique navigable, sans animation
- [x] Phase 2 — hero R3F, plan de coupe au scroll, cote animée
- [x] Phase 3 — révélations, sticky stacking, dessins tracés, index animé
- [x] Phase 4 — menu, transitions de page, curseur, magnétisme, préchargeur
- [ ] Phase 5 — Lighthouse, clavier, reduced motion, navigateurs
