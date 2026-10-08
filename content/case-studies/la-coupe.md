# La Coupe

> Le site d'un atelier d'architecture, construit comme un dessin de coupe : une maquette 3D que l'on tranche pour voir ce qu'il y a dedans, et un site qui parle le langage des plans, des cotes et du papier calque.

**Stack** : Next.js · TypeScript · Three.js · React Three Fiber · GSAP · Lenis · View Transitions API
**Durée** : 3 semaines, en parallèle d'autres projets
**Rôle** : conception, direction artistique, 3D, développement

---

## Le point de départ

Les sites d'architectes se ressemblent tous : une grille de photos, un fond blanc, un titre en capitales. Ils montrent des bâtiments de l'extérieur, alors que le métier consiste précisément à décider ce qui se passe à l'intérieur.

En architecture, le dessin qui révèle l'intérieur s'appelle une coupe. On tranche le bâtiment et on regarde la tranche. Je voulais que le site fasse exactement ça : une maquette blanche du projet phare, un plan qui descend du toit vers le sol, et des pièces qui apparaissent à mesure qu'il descend. La face tranchée en terre cuite, parce que c'est ainsi qu'on hachure les murs coupés sur un plan.

Tout le reste devait suivre ce langage. Des traits qui se dessinent au scroll, des cotes en mono, une seule couleur d'accent, un fond papier. Pas d'effet dont je ne pourrais pas expliquer le rapport avec l'architecture.

## Ce que j'ai décidé, et ce que ça a coûté

**Un seul modèle de données pour tout ce qui est dessiné.**
Chaque projet est décrit en mètres : emprise, refends, niveaux, type de toit, vide traversant. De ces descripteurs sont générés les plans et coupes en SVG des fiches, les massings 3D en fil de fer du menu, l'image de partage et la tuile du portfolio. Le projet phare est modelé à la main sur le même repère. Le gain, c'est la cohérence : la cote du hero, la coupe de la fiche et celle du footer affichent la même hauteur. Le coût, c'est que toute incohérence de données se voit immédiatement. J'ai découvert que ma maison faisait 9,20 m dans le hero et 12,45 m dans le footer, puis que la halle avait sa coupe dans le sens de la longueur, ce qui donnait un toit avec le faîtage dans le mauvais sens.

**Une seule boucle de rendu.**
Le canvas tourne en `frameloop="never"`. Le ticker de GSAP avance Lenis et la scène dans le même tick, et la scène ne se redessine que quand quelque chose a changé. Pas de deuxième `requestAnimationFrame`, pas de ScrollTrigger qui court derrière un scroll lissé. Le coût est venu d'ailleurs : le lint React Compiler du repo refuse toute mutation de valeurs de hooks dans `useFrame`, et toute la logique Three a dû sortir de React dans une classe impérative.

**Du `sticky` CSS plutôt qu'un pin ScrollTrigger pour le hero.**
Le pin faussait la position de tous les triggers qui suivaient, même après `refresh()`. Une section de plusieurs écrans avec la scène en `position: sticky` donne le même rendu, des mesures justes partout, et un seul écran sans JavaScript.

**Les View Transitions seulement pour l'élément partagé.**
L'image d'un projet s'étire jusqu'à devenir le hero de sa fiche : c'est le cas que l'API fait bien. Pour tout le reste, le fondu croisé par défaut superposait l'ancienne et la nouvelle page pendant une seconde. Le rideau est fait maison : il couvre avant que le DOM change, le scroll est remis à zéro sous la couverture, et il se lève après recalcul.

**Des images statiques plutôt que l'optimiseur de Next.**
Sur les previews, chaque photo était transformée à la première demande, et l'encodage AVIF à la volée prenait des secondes. Le pipeline génère en amont quatre largeurs en AVIF et WebP, un LQIP et la couleur dominante ; le composant image sert un `<picture>` sans intermédiaire. Ça a aussi retiré deux réglages globaux de `next.config` dont le portfolio n'avait pas besoin.

## Le problème qui m'a bloqué

**Le symptôme.** Sur une fiche projet, en 4G bridée, l'image de tête mettait 3 secondes à se charger. Elle pesait 44 ko. À ce débit, 44 ko devraient passer en 250 ms.

**Ma première hypothèse, qui était fausse.** J'ai accusé l'image. Qualité AVIF abaissée, largeur mobile ajoutée, 61 ko ramenés à 33. Les mesures n'ont pas bougé d'un dixième de seconde. J'ai aussi comparé avec les placeholders SVG : le LCP observé était identique. Le poids n'était pas le sujet.

**Ce que j'ai vraiment trouvé.** En relevant la cascade réseau entre la requête HTML et la fin de l'image, 497 ko étaient en vol en même temps qu'elle, sur une ligne à environ 200 ko/s. Trois sources : les polices du layout racine du portfolio, préchargées en priorité haute alors que l'expérience ne les affiche jamais ; le chunk Three.js de 237 ko, chargé « à l'inactivité » sur toutes les pages pour que la maquette du menu soit prête ; et les images de galerie, que Chrome déclenche très tôt sur connexion lente. L'image de tête ne faisait qu'attendre son tour.

**La solution.** Hors de l'accueil, Three ne se charge qu'à l'intention d'ouvrir le menu (survol ou focus du bouton) ou trois secondes après `load`, et le menu sait s'ouvrir sans maquette et la faire apparaître en fondu quand elle arrive. Les polices du portfolio ne sont plus préchargées, et le `<html>` ne demande plus Geist sous l'expérience. Résultat en local, contre un témoin bâti sur le même commit : image de tête de 3,0 s à 1,0 s, 497 ko en vol ramenés à 280.

Un détail qui a failli mal finir : ma première version du chargement différé appelait une fonction qui lisait une variable `let` déclarée plus bas. Zone morte temporelle, aucune erreur visible, et Three ne se chargeait plus du tout sur l'accueil. C'est le test A/B contre le témoin qui l'a montré, pas moi.

**Ce que j'en retiens.** Une image lente n'est pas forcément une image lourde. Regarder ce qui se télécharge en même temps qu'elle avant de toucher à sa qualité. Et mesurer sur l'environnement cible : mes 2,6 s de référence venaient de `localhost`, où le réseau n'existe pas.

## Les détails qui ont demandé plus de temps que prévu

- **La face coupée.** Un plan de clipping laisse voir l'intérieur creux des volumes. Le capping se fait au stencil : les faces arrière incrémentent, les faces avant décrémentent, et un quad à la hauteur de coupe ne se dessine que là où le stencil est non nul. Quand le plan arrive exactement sur une dalle, il devient coplanaire avec sa face et le stencil scintille. Le plan s'arrête 3 cm plus bas.
- **Le fondu entre le SVG et la 3D.** Avant que Three soit chargé, le hero affiche un dessin axonométrique de la maquette. Pour que le fondu soit invisible, le SVG et la caméra orthographique utilisent la même projection, le même azimut et la même plongée, et le canvas se cadre sur le repère du SVG mesuré au pixel.
- **L'intro.** La coupe était d'abord pilotée par le scroll sur trois écrans. À l'usage, c'était trop lent : deux coups de molette et le toit s'ouvrait à peine. Elle joue maintenant seule, en 2,6 secondes, et s'arrête à un mètre du sol, la hauteur conventionnelle d'un plan d'architecte : au repos, la maquette *est* le plan du rez-de-chaussée. Le scroll est libre dès le premier geste.
- **Le curseur.** Un point blanc en `mix-blend-mode: difference` est noir sur papier et blanc sur encre, pixel par pixel. Il restait blanc partout parce que son conteneur fixe, avec `z-index` et `will-change`, créait son propre contexte d'empilement : le mélange se faisait avec un groupe vide. Le mélange est posé sur l'élément fixe lui-même.
- **La typographie.** Espaces fines insécables devant la ponctuation haute, noms composés qui ne se coupent jamais au trait d'union, ponctuation collée aux italiques. SplitText normalisait les espaces fines en espaces ordinaires jusqu'à ce que je trouve `reduceWhiteSpace: false`.
- **Le menu.** Le fil de fer suit le projet survolé. Pour éviter les clignotements quand on balaie la liste, un survol ne devient cible qu'après 120 ms de pointeur immobile, et un changement de cible repart de l'opacité courante au lieu de remettre à zéro.

## Résultat

- Lighthouse desktop : 100 / 100 / 100 / 100
- Lighthouse mobile, accueil : 96 / 100 / 100 / 100, LCP 1,8 s en 4G bridée
- CLS à 0 et zéro violation axe-core sur les six gabarits, en desktop, mobile et mouvement réduit
- 60 fps au scroll sur l'accueil complet, menu ouvert compris
- Three.js absent du JavaScript initial : 237 ko chargés à part, après le premier rendu
- 67 photos en quatre largeurs, aucune au-dessus de 300 ko
- Un site complet sans WebGL et sans JavaScript côté contenu

[Voir l'expérience →](/experience/la-coupe)
[Le code sur GitHub →](#)

## Ce que je referais autrement

Je commencerais par le contenu. J'ai construit tout le site sur des dégradés avec un ratio écrit dessus, et je n'ai pu juger la direction artistique qu'une fois les vraies photos en place. Plusieurs décisions de mise en page ont été reprises à ce moment-là.

Je testerais le hero sur de vrais gens dès la première version. La coupe pilotée par le scroll avait l'air juste sur le papier et dans mes contrôles, et elle était trop lente pour n'importe qui d'autre.

Je choisirais un projet phare plus riche. Une coupe n'impressionne que si le bâtiment a des choses à révéler : une double hauteur, un escalier qui traverse, des gradins. Ma maison procédurale est un bloc simple, et le hero vaut ce que vaut ce qu'il tranche.

Et je fixerais les conditions de mesure dès le premier jour. La moitié de mes écarts de performance étaient des écarts de méthode entre `localhost`, la preview et la production.
