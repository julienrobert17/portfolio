# Groove To Grave — compte-rendu de Phase 2 (identité et fondations)

10 octobre 2026 · branche `experience/groove-to-grave` · worktree `.claude/worktrees/groove-to-grave`

## Fait

- **Passe d'identité appliquée.** Brief en v1.2 avec la liste des changements en tête (commit `943ac67`) : §2.2 « Identité relevée » (monogramme G2G, crâne coiffé d'un vinyle, style commun, lettrages jamais imités), règle des noms d'artiste, mastering « Octavix Studio » sur GTGR02 en `verified: false`, palette §3.1, typographies confirmées, skin dessiné comme les étiquettes, fin de bande gardée par le crâne, page soirées en mur de flyers, bandeau de tête des pages sortie, §11 sans `red` en texte.
- **Tokens** (`ccf1997`) : `tokens.ts` sans placeholder, 14 paires texte/fond listées, `tokens.test.ts` lancé par `npm run test:g2g-tokens`. Toutes les paires passent ; `redInk #c21e19` fait 4,84:1 sur `wall`, aucun assombrissement nécessaire.
- **Contenu** (`904c01e`, `40f9f3e`) : seuls des noms d'artiste sont affichés (crew crédité sous ses noms de scène, A&R des compilations sous « Julius »), champ `aVerifier` sur les sorties.
- **Logos provisoires** (`5712316`) : `scripts/g2g-logos.ts`, potrace installé par Homebrew (outil machine, hors repo). Monogramme recadré sur l'étiquette GTGR03 en pleine résolution (540×860 px), crâne sur l'étiquette GTGR05 (480×540 px), seuillage, filtrage des composantes étrangères à la silhouette (rochers, étoile, éclat de flamme), potrace avec `turdsize 8`, SVG une couleur en `currentColor`. Fichiers `ui/logos/monogramme.svg`, `crane.svg`, `traces.ts` et composant `logo.tsx`, tous `PLACEHOLDER-TRACE`. Favicon de l'expérience `src/app/experience/groove-to-grave/icon.svg`. Planche `docs/groove-to-grave/planches/logos-2026-10-10.jpg`.
- **Fondations** (`bd094d2`) : route `src/app/experience/groove-to-grave/` avec layout (Archivo variable en largeur préchargée, Permanent Marker et VT323 différées, tokens en variables CSS, `robots: noindex` tant que la route est en preview), huit pages en rendu serveur avec le vrai contenu : accueil, sorties (filtre `?genre=` lu côté serveur, presets en liens), sortie, artistes, artiste, soirées, label, contact. Skin statique du lecteur dans le layout (monogramme, navigation avec `aria-current`, afficheur figé, presets en liens, lien Bandcamp), cassette SVG colorée depuis la pochette avec texte de bande en ink ou poster selon le contraste, flyers réels collés au scotch avec rotation déterministe de 2° au plus, fin de bande avec le crâne et « rembobiner » en ancre, newsletter par server action qui valide et n'enregistre rien, retour d'état dans l'URL. Parcours complet sans JavaScript : seul `nav-liens.tsx` est un composant client, pour `aria-current`.
- **Soirées par logique de date** : `soireesAVenir()` et `soireesPassees()` comparent à la date du jour ; la page soirées est régénérée chaque heure (`revalidate = 3600`), l'accueil est dynamique. Le 11 octobre 2026 est « à venir » aujourd'hui et passera en archive demain sans changement de contenu. État vide prêt pour le jour où aucune date n'est annoncée.
- **Planches** (`3f3ab69`) : `scripts/g2g-planche-captures.ts`, Chrome installé sur la machine piloté par le protocole DevTools (WebSocket natif de Node, aucune dépendance), émulation d'appareil, captures pleine page. `phase-2-1440-2026-10-10.jpg` (9 pages) et `phase-2-390-2026-10-10.jpg` (9 pages, échelle 2).
- `tsc`, lint et build propres avant chaque push.

## Arbitrages

- **Chrome headless et le 390** : Chrome refuse une fenêtre de moins de 500 px, la première passe mettait la page en page à 500 px et la rognait à 390. Le script est passé au protocole DevTools pour une vraie émulation d'appareil ; les planches sont composées sur un fond créé par sharp, un SVG unique dépassant sa limite de 32 767 px.
- **Menu mobile sans JavaScript** : le brief prévoit un bouton « menu » qui ouvre la barre du skin en plein écran, ce qui demande du JavaScript ou un `<details>` que le CSS ne peut pas forcer ouvert sur desktop. En Phase 2 la barre de menu reste visible et passe sur deux lignes à 390 px, cibles de 40 px. Le bouton menu arrive avec le lecteur en Phase 3.
- **Mention « concept non officiel »** : dans la barre de titre du skin sur desktop, masquée à 390 px où elle ne tient pas ; elle reste dans la fin de bande sur tous les formats.
- **Skin et presets dans le layout** : le layout ne lit pas les search params, le compteur SORTIES y affiche le total et TOUT reste allumé ; la page sorties porte ses propres filtres avec l'état courant. La synchronisation passera par le store en Phase 3.
- **Bouton écouter** : absent en Phase 2, conforme au brief (rendu seulement si JavaScript est actif et qu'un extrait existe).
- **Bandeau de tête des sorties** : texte en `poster` quand `ink` fait moins de 4,5:1 sur la dominante (GTGR02, GTGR05).
- **Feuille de style** : une feuille `styles/g2g.css` posée sur `.g2g`, pas de CSS modules pour les fondations ; à découper par composant si la Phase 3 l'exige.
- **Débordements mobiles** corrigés après revue : grilles en `minmax(0, 1fr)`, `overflow-wrap: anywhere` sur les titres d'affiche, texte de cassette empilé.

## Résultats

- Build : 9 routes de l'expérience, les fiches sortie et artiste prérendues par `generateStaticParams`, 200 sur chaque page.
- Hauteurs des captures : accueil 2 961 px à 1440, 8 070 px à 390 ; soirées 6 155 px à 1440, 18 132 px à 390 (17 flyers).
- Logos : monogramme 440×773 px tracé, crâne 350×521 px, 1 685 et 8 176 caractères de tracé.
- Contrastes : 14 paires vérifiées ; `red` et `green` sur `wall` et `poster` entre 3,0 et 4,2:1, interdits en texte comme prévu.

## Reste

- Passe de direction du directeur artistique sur les trois planches, puis Phase 3 (moteur audio, skin complet, mode mini, barre mobile, bouton menu, presets synchronisés, Media Session).
- Fichiers de logo du label pour remplacer les tracés `PLACEHOLDER-TRACE`.
- Lighthouse et audits de performance en Phase 6 ; aucun audit fait en Phase 2.
- Les quatre soirées non vérifiées, les genres et les textes `draft` restent à valider par le label.
- Le fichier `phase1.txt` exporté dans le worktree n'est pas commité.
