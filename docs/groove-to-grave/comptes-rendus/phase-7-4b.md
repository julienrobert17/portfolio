# Groove To Grave — compte-rendu du bloc 7.4b (clôture de 7.4, image LCP, latence du pipeline)

12 octobre 2026 · branche `experience/groove-to-grave` · commits `6246b25` (relais), `7a4e7a8` (ffmpeg dans l'Action), `173a68a` (préchargement LCP), `d03923a` (variante même origine, mesure, brief) · production https://portfolio-eight-sable-66.vercel.app · preview de la branche https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app

## 1. Clôture de la Phase 7.4 : g2g-verif contre la production

Le déploiement de production du commit de fusion a d'abord **échoué sans build** : `git_info_fail`, l'intégration GitHub de Vercel n'a pas pu lire le dépôt. Rien à voir avec le code ; le même commit relancé par l'API Vercel (`portfolio-lp6o7y110`) est passé. À retenir : un échec de déploiement n'est pas forcément un échec de build, et `vercel inspect --logs` ne dit rien dans ce cas — c'est `errorCode` sur l'API qui le donne.

**`npx tsx scripts/g2g-verif.ts --url https://portfolio-eight-sable-66.vercel.app` : 154/154.** Résultat complet joint au compte-rendu de la Phase 7.4 (`phase-7-4-g2g-verif-production.md`), et la section 4 de ce compte-rendu a été complétée. Les quatre chemins d'arrivée, aux deux formats, avec les images et les extraits servis par le CDN Sanity : AudioContext `absent → running` au premier vrai clic, position qui avance, spectre qui bouge, aucune erreur de console.

## 2. Image LCP de la page sortie

**Ce qui n'allait pas.** Le diagnostic Lighthouse était précis : l'image était bien découvrable, en `fetchpriority=high` et `loading=eager` (ces trois contrôles passaient déjà), mais le **délai avant la requête** était de 354 ms — le navigateur ne demandait la pochette qu'une fois la mise en page faite, parce qu'elle vit maintenant sur une autre origine et que rien ne l'annonçait dans le head.

**Correctif retenu** (`173a68a`). `<Photo>` pose lui-même, pour l'image marquée `priority`, un `<link rel="preload" as="image">` dans le head (`preload` de `react-dom`, rendu serveur) avec **exactement** le `srcset` AVIF, le `sizes` et le `fetchpriority="high"` de la source de son `<picture>` : la cohérence est garantie parce que les deux sont écrits au même endroit, dans le même composant. Vérifié dans le HTML servi : un seul lien, `imagesrcset` identique au `srcset` de la source, `imagesizes` identique au `sizes`, et **une seule requête image** vers le CDN (pas de double téléchargement). La pochette garde `fetchpriority=high` et `loading=eager`, toutes les autres images sont en `lazy` (13 sur la page soirées, 0 en eager).

**Effet mesuré.** Le défaut visé a disparu : délai avant la requête **354 ms → 22 ms**, image en priorité haute, une seule requête. Mais le score ne bouge pas : la page sortie reste à 94-95 (LCP 2,9-3,0 s) sur cinq passages, parce que le LCP simulé par Lighthouse n'est pas borné par la découverte de l'image mais par les octets qui passent avant elle (document 17 kB, polices 48 kB, CSS 16 kB, image 31 kB : 240 kB sur un lien 4G simulé à 1,6 Mbit/s).

**Variante proxy même origine, mesurée comme demandé** (`d03923a`, `G2G_MEDIAS_MEME_ORIGINE=1`) : réécriture Next `/experience/groove-to-grave/media/:fichier*` → CDN Sanity, URL réécrites dans l'adaptateur, `preconnect` retiré. Déployée sur la preview, cinq passages :

| Page | CDN direct (avant 7.4b) | CDN direct + préchargement | Même origine + préchargement |
|---|---|---|---|
| accueil | 99 · 1,96 s | 99 · 2,17 s | 99 · 2,26 s |
| sorties | 99 · 2,12 s | 97 · 2,66 s | 99 · 1,96 s |
| **sortie-gtgr05** | **95 · 2,87 s** | **94 · 3,01 s** | **95 · 2,90 s** |
| soirees | 99 · 2,18 s | 99 · 1,99 s | 99 · 2,11 s |

Les cinq passages d'une même page vont de 92 à 100 : l'écart entre ces trois colonnes est dans le bruit. **La variante même origine n'apporte rien de mesurable** ; elle ajoute un saut (Vercel relaie vers le CDN), de la bande passante Vercel, et masque le cache du CDN. **Je ne la retiens pas.** Le code reste derrière le drapeau, à zéro effet quand il est absent : il servira peut-être le jour du domaine du label, puisqu'il supprime aussi la déclaration CORS. Le préchargement, lui, est gardé : il corrige un vrai défaut de 350 ms, même si Lighthouse ne le récompense pas.

**L'objectif de 97 et de 2,6 s n'est pas atteint sur la page sortie, et je ne sais pas l'atteindre sans toucher à l'œuvre ou aux polices.** Ce qui reste, par ordre de gain probable : les deux polices chargées avant le LCP pèsent 48 kB (Archivo 43, VT323 5) soit 20 % des octets, VT323 ne servant qu'à l'afficheur du lecteur ; 150 ms de JavaScript inutilisé d'après Lighthouse ; une largeur intermédiaire (720 px) dans la série d'images économiserait environ 14 kB sur le format mobile. Le critère bloquant du brief (≥ 95) est tenu ; la page est à la limite. Dis-moi si tu veux que j'aille chercher ces points.

## 3. Latence du pipeline : webhook → route → Action

**En place.** Route `/api/g2g/medias` (`6246b25`) : signature vérifiée avec `SANITY_WEBHOOK_MEDIAS_SECRET` (créé, posé dans les variables Vercel pour les trois environnements), puis `repository_dispatch` de type `g2g-medias` vers le dépôt, avec un jeton GitHub rangé dans `G2G_GITHUB_TOKEN` côté Vercel — jamais dans la configuration du webhook Sanity, jamais dans le dépôt. Webhook Sanity `BqaNGJpVk9d5YZyz` créé. L'Action garde son déclenchement planifié toutes les 15 minutes en filet.

**Mesure réelle** (`scripts/g2g-mesure-pipeline.ts`, dépôt d'un morceau de synthèse de 3 min sur la piste B1 de GTGR01, exactement ce que fait le label quand il dépose un fichier et publie) :

| Étape | Délai depuis le dépôt |
|---|---|
| Webhook Sanity reçu par le site | **1,8 s** |
| `repository_dispatch` envoyé | 5,1 s (relais local, voir ci-dessous) |
| Action GitHub terminée | 101,0 s |
| **Extrait traité visible en production** | **104,6 s** |

Détail de l'Action (97 s) : 4 s de file d'attente, 12 s de `checkout`, 8 s de `setup-node`, 22 s de `npm ci`, **30 s d'installation de ffmpeg**, 14 s de pipeline (dont 12 s de traitement réel : découpe à 60 s, normalisation à −14,3 LUFS, crête −2,1 dBTP, 126 BPM estimés), 1 s d'artefact. Puis la revalidation est quasi immédiate (3,6 s entre la fin de l'Action et la page servie).

**Donc : environ 1 min 45 s, pas « quelques secondes ».** C'est l'Action qui coûte, pas le relais (1,8 s). Avant ce bloc, c'était jusqu'à 15 min d'attente plus ces 97 s. Pour descendre à quelques secondes il faudrait faire le traitement dans la fonction Vercel elle-même, ce qui demande `ffmpeg-static` (nouvelle dépendance, ~25 Mo dans le paquet de la fonction, limite de 300 s) : je ne l'ai pas prise, je te la propose. Gains plus modestes sans rien installer : mettre ffmpeg en cache ou prendre un `checkout` partiel feraient gagner ~35 s.

**Deux choses que j'ai dû corriger ou constater en route.**
- **ffmpeg n'est plus préinstallé sur `ubuntu-latest`.** Ma première exécution par `repository_dispatch` a échoué sur « ffmpeg introuvable », alors que l'étape de vérification venait de passer : elle utilisait `ffmpeg -version | head -1`, et le code de sortie d'un tube est celui de `head`. Faute de ma part, dans le workflow livré en 7.4. Corrigé (`7a4e7a8`) : installation par `apt-get`, vérification sans tube.
- **`delta::changedAny` ne livre rien.** Le filtre voulu — ne déclencher que si un fichier d'origine change — a été essayé avec trois sélecteurs (`pistes[].extraitBrut.asset._ref`, `pistes`, et le tuple complet) : aucune livraison, alors que le webhook de revalidation voyait les mêmes changements à la seconde près et que le même webhook, avec un filtre simple `_type == "sortie"`, se déclenchait bien. Je n'ai pas pu isoler davantage : **le plan Free est limité à 2 webhooks**, les deux sont pris (revalidation et médias), donc pas de webhook d'essai à côté ; et le journal des tentatives de Sanity a plusieurs dizaines de secondes de retard, ce qui rend les essais lents et trompeurs. Le filtre est donc `_type in ["sortie","soiree","artiste"]`, sans delta : le relais part à chaque publication, y compris pour les patches du pipeline. **La boucle s'arrête d'elle-même** (l'exécution déclenchée par un patch du pipeline ne trouve rien à traiter grâce à l'empreinte et n'écrit rien), au prix d'une exécution à vide de ~70 s après chaque traitement et après chaque publication de texte. Si tu veux supprimer ces exécutions à vide, la piste propre est une première étape dans l'Action qui interroge Sanity en une requête et sort tout de suite s'il n'y a rien à faire.
- La route répond **200 et non 503** quand le jeton GitHub manque : une réponse en échec finirait par faire désactiver le webhook par Sanity, alors que l'Action planifiée fait encore le travail.

**Ce qui te reste à faire pour que le relais soit actif en production :**
1. **Fusionner la branche** (je ne peux pas : le classifieur de permissions refuse la fusion). Tant que la route n'est pas en production, le webhook l'appelle et reçoit 404 — c'est ce que montre la mesure ci-dessus, où le relais a été envoyé depuis ma machine à la place de la route.
2. **Créer un jeton GitHub à portée minimale** et le poser dans les variables Vercel sous `G2G_GITHUB_TOKEN` : jeton *fine-grained*, dépôt `julienrobert17/portfolio` seulement, permission **Contents : lecture et écriture** (c'est celle qu'exige `repository_dispatch`). Il n'existe pas d'API pour créer un jeton personnel, et le jeton du trousseau de cette machine est un jeton OAuth large (`repo`, `workflow`) : le mettre dans Vercel serait un mauvais échange.

## 4. Brief mis à jour

- **Préchargement de l'image LCP** : règle écrite dans la section performance — `priority` sur `<Photo>`, lien `preload` dans le head avec le même `imagesrcset`, `imagesizes` et `fetchpriority`, les deux écrits au même endroit ; et la règle de géométrie identique avant et après l'hydratation (pas de mise en page conditionnée à `data-js`, `@media (scripting: none)` pour les variantes sans script).
- **CORS Sanity** : « toute origine qui sert le site doit figurer dans `sanity cors list` avant sa mise en ligne — le domaine final du label le jour où il est choisi, en même temps que `G2G_URL_SITE` et le retrait du `noindex`. Sans cela les images s'affichent encore mais le lecteur reste muet : le CDN refuse l'audio analysé. » Origines déclarées à ce jour : production Vercel, preview de la branche, `localhost:3999`.

## 5. Autre

- Les dix-sept fichiers de `docs/groove-to-grave/comptes-rendus/` ont été trouvés supprimés dans le worktree en cours de bloc, sans qu'aucune de mes commandes ne les vise ; restaurés depuis git (`git checkout --`), rien de perdu, aucun autre dossier touché. Je ne sais pas ce qui les a supprimés ; si tu as un script ou un outil qui passe sur ce dossier, c'est la piste.
- Piste B1 de GTGR01 remise en état après chaque mesure (fichiers supprimés, champs vidés) ; l'instantané Sanity n'a pas changé.

## 6. Reste

- Fusion, puis jeton `G2G_GITHUB_TOKEN` (§3) ; ensuite je relance `g2g-mesure-pipeline.ts` sans relais local pour la mesure de bout en bout vraie.
- Décision sur les 95 de la page sortie (§2).
- Phase 7.5 (autonomie du label) : en attente de tes essais Safari et iPhone, comme convenu.
