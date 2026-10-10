# Groove To Grave — compte-rendu de Phase 6 (finition et audits), avec le bloc 5.1

10 octobre 2026 · branche `experience/groove-to-grave` · worktree `.claude/worktrees/groove-to-grave` · preview Vercel : https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app/experience/groove-to-grave (alias de branche, HTTP 200 ; pas de fusion)

## Fait

### Bloc 5.1, passe de direction sur la Phase 5 (`cd495c8`)

1. **Lambeaux du mur.** Six lambeaux placés en fractions de l'écran (`u_resolution / u_echelle`), largeur de 14 à 28 % de l'écran, 24 % de la surface en tout, donc toujours 6 par écran et jamais plus d'un tiers couvert, sur desktop comme sur mobile (texture de repli mobile régénérée au ratio 390 × 844, répétée verticalement : un écran, six lambeaux). Chaque lambeau porte une trace d'impression abstraite dans son propre repère, trame de points de 8 px ou trois filets de 3 px selon sa graine, 10 % plus sombre, jamais sur le liseré ; aucun texte ni forme reprise d'une œuvre. Tokens `trameSombre` et `lisereSombre` dérivés des constantes du shader (`LAMBEAU` dans `tokens.ts`) et vérifiés à 7:1 sous ink (7,36 et 7,36) ; 19 paires. Au passage, un bug du bloc 4.1 : le liseré était inversé (`1 - smoothstep`), ce qui assombrissait tout le lambeau de 10 % sans liseré ; corrigé, vérifié au pixel sur le rendu brut (couleur dominante du lambeau rouge = `lambeauRouge`, plus sombre 210,150,138).
2. **Pages artiste.** Plus de message interne : sans présentation, la page montre le nom, la ligne de statut et les sorties.
3. **Invités de compilation.** Bande de papier comme les autres pages, ligne « N compilation(s) sur le label · GTGRVA02 », puis « Sur le label » : la cassette de la compilation et la ligne de chaque morceau de l'artiste (position, titre, featuring éventuel, bouton écouter s'il y a un extrait, durée). La pochette en grand et le bandeau dans la dominante sont réservés aux artistes ayant une sortie solo illustrée (Azbine, Kitchen Plug, Emi Ömar, Merov', LukasDarian).

### Phase 6, finition et audits (`191dc74`, `df6c534`, `HASH_DOCS`)

**Performance** (`scripts/g2g-lighthouse.ts` : build de production local, `next build` puis `next start`, `npx lighthouse@13.5.0` sans rien ajouter au dépôt, Chrome headless sur le GPU de la machine, mobile simulé puis desktop, strictement l'un après l'autre, trois passages par page, médiane par la performance ; rapports HTML de la médiane dans `docs/groove-to-grave/lighthouse/phase-6/`).

| Format | Page | Perf | Access. | Bonnes pratiques | SEO | LCP | CLS | TBT | JS | 3 passages |
|---|---|---|---|---|---|---|---|---|---|---|
| mobile | accueil | 93 | 100 | 100 | 66 | 3,15 s | 0,000 | 9 ms | 204 kB | 93/93/91 |
| mobile | sorties | 92 | 100 | 100 | 63 | 3,30 s | 0,000 | 9 ms | 205 kB | 92/92/92 |
| mobile | sortie-gtgr05 | 91 | 100 | 100 | 66 | 3,38 s | 0,000 | 7 ms | 204 kB | 91/91/91 |
| mobile | soirees | 91 | 100 | 100 | 66 | 3,53 s | 0,000 | 8 ms | 203 kB | 91/91/91 |
| desktop | accueil | 100 | 100 | 100 | 66 | 0,68 s | 0,001 | 0 ms | 210 kB | 100/100/100 |
| desktop | sorties | 100 | 100 | 100 | 63 | 0,68 s | 0,001 | 0 ms | 210 kB | 100/100/100 |
| desktop | sortie-gtgr05 | 100 | 100 | 100 | 66 | 0,68 s | 0,001 | 0 ms | 210 kB | 100/100/100 |
| desktop | soirees | 100 | 100 | 100 | 66 | 0,69 s | 0,000 | 0 ms | 209 kB | 100/100/100 |

Mesure complémentaire, même outil et même profil mobile, sur la preview Vercel (HTTP/2, Brotli, CDN) : accueil mobile 86, 96 et 96 (médiane 96), LCP simulé 2,7 à 2,8 s, TBT 0 à 10 ms, FCP 1,2 s ; rapport `preview-vercel-accueil-mobile.html`. Le modèle pénalise le serveur local (HTTP/1.1, gzip) ; sur l'hébergement réel, l'accueil mobile passe le critère.

- Corrections faites, de 77 (premier passage mobile, TBT 400 ms, LCP 4,0 s) à 91-93 : ticker en `requestAnimationFrame` natif ; GSAP (sans ScrollTrigger, 27 kB) et Lenis chargés à l'inactivité après le premier rendu, hors du JavaScript initial ; compilation du shader en parallèle (`KHR_parallel_shader_compile`, plus de tâche longue de 415 ms) et shader allégé (papier calculé une fois, lambeaux rééchantillonnés seulement pour le décalage chromatique, déchirures à 3 octaves) ; canvas créé côté client ; presets et SVG de cassette dans des modules minuscules pour les composants client ; audits sans redirection de slash final.
- **JavaScript chargé avant interaction sur l'accueil** : 204 kB transférés (gzip) sur 14 fichiers, dont 181 kB avant le LCP ; part de l'expérience : 19 kB (lecteur 13, store et moteur 6), le reste est le socle Next (React DOM 70, routeur 39, client 50). GSAP (27 kB) et le shader (4 kB) arrivent à l'inactivité.
- **Pourquoi 91-93 et pas 95 en mobile.** TBT, CLS, FCP et Speed Index sont au maximum ; seul le LCP simulé (3,2 à 3,5 s) retient le score. Le premier rendu réel est à 83 ms (136 ms avec le CPU ralenti ×4). Le modèle Lantern de Lighthouse estime le LCP d'un texte comme le temps de téléchargement, à 1,6 Mbit/s, de **toutes** les ressources demandées avant le LCP observé (`LargestContentfulPaint.getPessimisticGraph` traite chaque nœud comme bloquant) : HTML 33 kB, CSS 15 kB, polices 124 kB (Archivo variable 88, Permanent Marker 29, VT323 7), JavaScript 181 kB. Il faudrait retirer environ 120 kB de ce chemin pour passer sous 2,9 s ; notre part du JavaScript est de 19 kB. Les leviers restants sont des décisions de direction : `font-display: optional` ou chargement différé de Permanent Marker et VT323 (−36 kB, environ −0,2 s, au prix d'un rendu en police de repli au premier chargement), sous-ensemble local d'Archivo (outil `pyftsubset` à installer, non autorisé sans accord), ou polices de repli système. Le critère LCP < 2,5 s n'est pas atteint pour la même raison.
- **SEO 63-66** : seul audit en échec `is-crawlable`, à cause du `robots: noindex` voulu par le brief tant que le label n'a pas donné son accord ; sans lui, 100. À lever le jour de la mise en ligne publique.

**Accessibilité** (`scripts/g2g-a11y.ts`, axe-core 4.14 extrait par `npm pack` dans le cache hors dépôt, Chrome headless) : 42/42 contrôles.

- axe-core : zéro violation sur les onze pages aux deux formats, plus les états en lecture, feuille ouverte et menu ouvert. Corrections : texte de 13 px sur `green` (4,07:1) passé en `greenDeep` sous `poster` (sticker « no repress », affiches vertes des artistes) ; bandeau GTGRVA02 (vert à 4,1:1 sous ink et 4,2:1 sous poster) : `couleursBandeau` rapproche la dominante du texte par pas de 5 % jusqu'à 4,5:1, la pochette reste intacte ; liens de cassette et d'accueil nommés par leur texte visible (référence masquée visuellement, « , accueil » masqué) ; clone d'insertion `inert`.
- Parcours au clavier, desktop et mobile : premier Tab sur le lien d'évitement, Entrée amène dans le contenu, ordre skin puis contenu puis pied, focus visible partout (double anneau ; sur les curseurs, l'anneau est sur le pouce), rien sous le skin au focus (`scroll-padding-top` 148 px sur desktop, 172 px entre 768 et 1100 px, 72 px et 80 px en bas sur mobile). Menu et feuille : focus dedans à l'ouverture, contenu et pied de page inertes, Tab cycle entre le skin et le panneau (par le début du document, ce qui n'est pas un piège), Échap ferme et rend le focus au bouton d'origine.
- Annonces `aria-live` : « Lecture : GTGR05, Merov', UFO Catcher » puis « 3 sorties pour house ».
- Replis page par page aux deux formats : mouvement réduit (bande statique, collage immédiat, aucune erreur), sans JavaScript (barre statique, filtres en liens, texture de repli, pas de canvas), sans WebGL (canvas absent, texture de repli).

**Revue de code ciblée.** Aucun `Math.random` au rendu (le seul est dans `sons-interface.ts`, bruit du souffle, dans le moteur) ; aucun `useSearchParams` ; `new AudioContext()` seulement dans `Moteur.demarrer()`, appelé par `lire()` depuis un geste ; aucun import Prisma sous `groove-to-grave` ; `git diff main -- package.json` ne touche que le script `test:g2g-tokens` ; `scripts/g2g-lib.ts` n'applique aux œuvres que `rotate()` (orientation EXIF) et un redimensionnement proportionnel.

**Tuile du carrousel.** `scripts/generate-g2g-tuile.ts` écrit `public/experience/groove-to-grave/tuile.svg` (monogramme, cassette aux couleurs de GTGR05, sticker, deux lambeaux pâles, palette du site, 4 kB). Accent `#F14442` dans `src/lib/accents.ts`. Entrée Prisma préparée dans `prisma/seed.ts` (upsert `groove-to-grave`, `featured: true`, `publishedAt` 2026-10-10), **non exécutée**. Pour l'écrire en base, depuis la racine du dépôt principal, avec le `.env` de production :

```
npx prisma db seed
```

Le seed réécrit aussi les autres projets (upsert) ; pour n'écrire que celle-là, retirer temporairement les autres blocs ou passer par Prisma Studio.

**Brief v1.4** : changements depuis la v1.3 en tête, §3.6, §6 et §8 mis à jour, definition of done cochée ligne par ligne avec sa preuve ; restent ouvertes Lighthouse mobile et SEO (décisions ci-dessus), VoiceOver, planches validées, Safari, accord du label.

**Planches et vidéos.** `phase-6-1440/` (18 images) et `phase-6-390/` (19 images), vidéos de 30 s avec le son (même parcours que la Phase 5 : insertion, trois pages en lecture, fin de bande, rembobinage). `scripts/g2g-verif.ts` : 86/86.

## Arbitrages

- **Ticker natif et GSAP à la demande** : écart à la copie de la-coupe (brief v1.1, arbitrage 4), consigné au brief §3.6 et §6 ; même contrat `onTick`, GSAP préchargé à l'inactivité pour que la première insertion et la première transition restent fluides.
- **Chrome headless sans SwiftShader pour Lighthouse** : le GPU de la machine (ANGLE Metal) rend le mur comme un appareil réel ; avec SwiftShader la compilation du shader comptait 900 ms de tâche longue.
- **Bandeau rapproché du texte** : plutôt que d'imposer poster sur un vert à 4,2:1, l'aplat glisse vers le texte ; seul GTGRVA02 est concerné (25 % vers ink).
- **Pied de page inerte sous un panneau** : nécessaire pour qu'un Tab depuis le menu n'atterrisse pas dans le pied de page.
- **Captures pleine page** : le canvas y est rendu à la hauteur du document, les lambeaux y sont donc plus hauts que sur un écran réel (position fixe à la fenêtre) ; même remarque pour FIN DE BANDE dans l'afficheur.

## Résultats

- Lighthouse : desktop 100/100/100 sur les quatre pages ; mobile 91-93/100/100 ; SEO 63-66 (noindex). TBT ≤ 9 ms, CLS 0.
- Accessibilité : 42/42 contrôles ; axe-core zéro violation.
- Mise en page et lecture : 86/86. Tokens : 19 paires.

## Reste

- Décisions : lever le `noindex` à la mise en ligne publique (SEO 100) ; stratégie de polices pour le LCP mobile ; exécuter ou non le seed.
- VoiceOver, planches finales et Safari macOS et iPhone, par le directeur artistique.
- Avec le label : accord écrit, vrais extraits (remesurer la normalisation), logos, adresse de contact, 4 soirées non vérifiées, genres et textes brouillon.
