# Groove To Grave Records — brief de conception

> Plateforme officielle de Groove To Grave Records, construite dans le portfolio sous `experience/groove-to-grave` · brief v1.6 · 11 octobre 2026 (v1 : 8 octobre, v1.1 à v1.4 : 10 octobre, v1.5 : 11 octobre 2026)
> **Statut (bloc 7.0, 11 octobre 2026) : le label a donné carte blanche** pour réaliser sa plateforme officielle et utiliser ses assets (pochettes, flyers, logos, musique). Le site n'est plus un concept : plus de mention « concept non officiel », crédit « Site réalisé par Julien Robert pour Groove To Grave Records » en pied de page, crédits des œuvres conservés (JeunePenard, LukasDarian, Cbrgraphics). Le domaine final n'est pas choisi (sous `/experience/groove-to-grave` dans le portfolio, ou un domaine du label) : le `noindex` reste jusqu'à ce choix et la canonical est paramétrable par `G2G_URL_SITE` (§8, §12). Le label doit pouvoir publier lui-même sorties, soirées et textes : Phase 7 (§9).

Fichier compagnon : `prototype-lecteur.html`, la maquette validée du lecteur. Elle sert de référence pour les **mécaniques** (son, presets, bande défilante, transition) et pour la synthèse des sons et boucles provisoires. Elle ne sert pas de référence de code : ses écarts connus sont listés en fin de document.

**Changements depuis la v1.5** (bloc 7.0, 11 octobre 2026) :

1. Statut : plateforme officielle, carte blanche du label pour les assets ; mentions « concept non officiel » retirées du skin, du pied de page, des métadonnées et de ce brief ; crédit du site en pied de page (§4, §10).
2. §8 : `noindex` maintenu jusqu'au choix du domaine, canonical paramétrable par la variable d'environnement `G2G_URL_SITE` ; l'exception SEO change de motif.
3. §9 : accord explicite pour la fusion sur `main` et pour une seule écriture en base (bloc 7.1) ; Phase 7 ajoutée (autonomie éditoriale du label, audit de CMS d'abord).
4. §12 : question du domaine final ; accord du label obtenu ; autonomie et extractibilité de la plateforme (§6).

**Changements depuis la v1.4** (bloc 6.1, 11 octobre 2026) :

1. §3.2, §6, §8 : polices auto-hébergées par `next/font/local`, sous-ensemblées par `scripts/g2g-polices.ts` (fontTools et brotli dans un environnement Python hors dépôt) : Archivo restreinte aux largeurs 75 à 100 % et graisses 400 à 900, les trois au jeu de caractères du site ; 69 kB avant le LCP au lieu de 124. Seule Archivo est préchargée.
2. §8 : la mesure de référence Lighthouse est la preview Vercel (HTTP/2, Brotli), mobile simulé, cinq passages par page, médiane ; la mesure locale reste indicative. Le critère SEO porte l'exception assumée du `noindex` tant que le label n'a pas donné son accord.
3. §9, §10 : ni seed, ni écriture en base, ni fusion sur main avant l'accord du label ; `scripts/g2g-upsert-projet.ts` remplace la commande de seed, non exécuté.

**Changements depuis la v1.3** (bloc 5.1 et Phase 6, 10 octobre 2026) :

1. §3.3, §5 : les lambeaux du mur sont placés en fractions de l'écran, six par écran, 30 % de la largeur au plus chacun, un quart de l'écran couvert ; chacun porte une trace d'impression abstraite (trame de points ou filets, 10 % plus sombre) ; tokens `trameSombre` et `lisereSombre` vérifiés à 7:1 sous ink.
2. §4 : page artiste sans message interne ; pochette en grand et bandeau dans la dominante réservés aux sorties solo ; un invité de compilation garde la bande de papier, puis la cassette de la compilation et la ligne de son morceau. Le bandeau rapproche sa dominante du texte quand ni ink ni poster n'atteint 4,5:1 (GTGRVA02), la pochette reste intacte.
3. §3.1, §8 : les aplats `green` sous un texte de moins de 24 px passent en `greenDeep` sous `poster` (sticker « no repress », affiches vertes des artistes) ; les liens sont nommés par leur texte visible.
4. §3.6, §6 : ticker en `requestAnimationFrame` natif ; GSAP (sans ScrollTrigger) et Lenis chargés à l'inactivité après le premier rendu, jamais dans le JavaScript initial ; compilation du shader en parallèle (`KHR_parallel_shader_compile`) ; le canvas n'existe que côté client.
5. §8 : Échap ferme le menu et la feuille et rend le focus au bouton d'origine ; le contenu et le pied de page sont inertes sous un panneau ; `scroll-padding-top` égal à la hauteur du skin ; scripts `g2g-lighthouse.ts`, `g2g-a11y.ts` et `g2g-verif.ts` comme preuves de la definition of done.
6. §9 : tuile du carrousel — rendue depuis la Phase 7.2 par la page hors navigation `/experience/groove-to-grave-tuile` (`noindex`) capturée par `scripts/g2g-tuile.ts`, exportée en `img/tuile-{320,480,640,960}.{avif,webp}`, `imageUrl` pointant `tuile-960.webp` ; accent `#F14442` dans `accents.ts`, entrée Prisma posée par `scripts/g2g-upsert-projet.ts`.

**Changements depuis la v1.2** (passe de direction 4.1 sur la Phase 4, 10 octobre 2026) :

1. §3.3 : plus aucun chevauchement entre cartes ; seuls le scotch et les stickers débordent, sur le mur seulement. Échelle de `z-index` unique.
2. §3.1 : tokens `lambeauRouge` et `lambeauVert` (wall mêlé de red ou de green à 35 % au plus) et `papierSombre` (grain le plus sombre du shader), ink à 7:1 au moins sur chacun, sur wall et sur le papier sombre (tokens.test.ts).

**Changements depuis la v1.1** (passe d'identité du directeur artistique sur la planche « relevé DA », 10 octobre 2026) :

1. §2.2 devient « Identité relevée » : monogramme G2G et crâne coiffé d'un vinyle, style commun des deux illustrateurs, lettrages jamais imités.
2. §2.1 : le site n'affiche que des noms d'artiste, jamais les noms civils lus sur les étiquettes ; mastering « Octavix Studio » ajouté à GTGR02, non vérifié.
3. §3.1 : palette relevée sur les pochettes (red, redInk, green, greenDeep, chrome, lcd) avec ses règles de contraste ; l'orange safety et le jaune fluo disparaissent du brief et du code.
4. §3.2 : Archivo, Permanent Marker et VT323 confirmés ; Permanent Marker réservée aux étiquettes de cassette et aux annotations.
5. §3.5 : skin du lecteur dessiné comme les étiquettes du label, contour ink et aplats, sans biseau gris ; monogramme dans la barre de titre.
6. §4 : fin de bande gardée par le crâne ; page soirées en mur de flyers réels ; bandeau de tête des pages sortie dans la dominante de la pochette.
7. §11 : plus de red en texte sur fond clair, redInk à la place.
8. Logos provisoires par vectorisation fidèle (potrace, outil machine hors repo) dans `ui/logos/`, commentaire `PLACEHOLDER-TRACE`, à remplacer par les fichiers du label.

**Changements depuis la v1** (arbitrages de la Phase 0, validés le 10 octobre 2026) :

1. Contenu typé sous `src/components/experience/groove-to-grave/content/`, comme la-coupe ; `content/groove-to-grave/` garde `sources.md`, `sources.json` et les originaux de médias (§4.1).
2. `sharp` reste une dépendance transitive de Next, comme dans la-coupe. (Depuis la Phase 7.3, le portfolio a une dépendance ajoutée et une seule : `next-sanity`, voir §6.)
3. Extraits provisoires synthétisés en TypeScript pur hors navigateur, WAV puis MP3 par `ffmpeg` ; plus de Playwright (§6).
4. `ticker.ts`, `gsap.ts`, `lenis-store.ts` et `use-page-settled.ts` dupliqués depuis la-coupe dans `groove-to-grave/lib/` avec un commentaire d'origine ; le repli de navigation sans navigateur enregistré passe par `router.push`, jamais `window.location.assign` (§6).
5. Mur WebGL en WebGL2 brut (un canvas, un quad, un fragment shader), sans three ni fiber : seul écart volontaire aux conventions de la-coupe, pour le poids (§5.5, §6).
6. Chaîne audio : normalisation des presets par table mesurée (§13.1, la « marge de −6 dB » d'origine est caduque) et `DynamicsCompressorNode` en limiteur avant le gain général (§3.7, §5.3).
7. iOS : la lecture au travers du graphe Web Audio s'arrête au verrouillage, c'est accepté ; l'état passe honnêtement en pause, reprise au geste suivant (§3.7).
8. Spectre DOM à 30 images par seconde au plus, arrêté quand rien ne joue (§3.5).
9. Objectif LCP mobile simulé porté à 2,5 s ; Lighthouse ≥ 95 reste le critère bloquant (§7).
10. Les search params ne sont lus que par les pages serveur et poussés dans le store par un composant client de page ; le lecteur ne les lit jamais (§4, §6).
11. Nouvelle section « Médias fournis par le label » (§7) ; le modèle de données passe à un extrait optionnel par piste (§4.1).

---

## 1. Concept

**Un lecteur des années 2000, couvert de stickers, dans lequel on insère les sorties du label comme des cassettes.**

Le site est un mur d'affichage sauvage parisien : affiches collées, scotch, marqueur, stickers, désordre volontaire. Par-dessus, collé en haut de l'écran, un lecteur audio au skin chromé imprimé à plat, à la manière des lecteurs PC du début des années 2000. Chaque sortie, chaque compilation et chaque soirée est une cassette étiquetée à la main. On la glisse dans le lecteur, elle claque, la bande démarre, et tout le site se met à bouger au rythme du morceau : la bande défilante du header, les bobines, l'afficheur, le mur.

Le lecteur n'est pas un widget ajouté au site, **il est le site** :

- son menu à icônes est la navigation ;
- sa bande défilante est le header ;
- ses presets d'égaliseur filtrent le catalogue **et** colorent le son ;
- ses compteurs donnent l'état du catalogue et de l'écoute ;
- changer de page, c'est une avance rapide de la bande, et la musique ne s'arrête jamais.

Le nom du label est raconté par la structure de chaque page : le *groove* en haut, là où la bande commence, et le *grave* en bas, avec la « fin de bande ».

Pourquoi cette direction :

- le son devient le moteur visuel du site, pas un lecteur posé dans un coin ;
- le ton du label (jeune, autodérisoire, diggers, culture club) passe dans l'objet plutôt que dans un décor ;
- aucun site de label primé ne ressemble à ça ;
- c'est l'opposé exact de « La Coupe », donc méconnaissable à côté.

Pistes écartées pendant la conception, à ne pas réintroduire : univers nautique et pirate, radio FM et fréquences, sillon de vinyle comme structure de navigation, plongée abyssale.

---

## 2. Identité

### 2.1 Ce qui est réel et utilisé tel quel

**Le label.** Groove To Grave Records, label et collectif basé à Paris, actif depuis 2022. Il est tenu par Julius (Jules Fritsch, A&R, qui jouait aussi sous le nom J. Fuego), LukasDarian (visuels, flyers, artwork des compilations) et Gregs (mastering des compilations, résident). Il signe des artistes émergents et presse des vinyles 12″ en édition limitée. Le son : house en fer de lance, breakbeat, minimal et électro, synthés « stellaires » et basslines grasses.

**L'écriture du nom.** On écrit « Groove To Grave » en titrage, « G2G » dans le registre familier, et « GTGR » uniquement pour les références de catalogue.

**Le ton verbal**, relevé sur leurs textes publics :

- autodérision : Kitchen Plug y est présenté comme « 3 silly boys » qui visent un résultat « brainless », et Azbine revendique une touche « retro has-been » ;
- argot de club et jeux de mots (« une pluie de skeuds affûtés, alors sortez couvert ») ;
- imaginaire spatial dans les textes de sortie (« vaisseau », « galaxie », « planètes funk, groove et électro ») ;
- textes de sortie en anglais pour les disquaires internationaux, textes de soirée en français avec beaucoup d'emojis.

Le site écrit en français, dans ce ton. Tout texte inventé par nous est marqué `draft: true` dans `content/` et doit être validé par le label.

**Les noms.** Le site n'affiche que des noms d'artiste ; les noms civils lisibles sur les étiquettes des disques ne sont jamais repris. Le mastering « Octavix Studio » lu sur l'étiquette de GTGR02 est repris en `verified: false`.

**Les crédits visuels.** Les pochettes des vinyles sont de **JeunePenard** (GTGR02, 03, 04 et 05). Les flyers et les compilations Summer Hits sont de **LukasDarian**. Ces œuvres sont affichées **intactes**, toujours créditées, jamais recadrées au point d'être dénaturées, jamais filtrées ni déformées. Le désordre du site s'applique autour d'elles, jamais sur elles.

**Formats récurrents :**

- vinyle 12″ de quatre titres (A1, A2, B1, B2), pressage limité, souvent sans repress ;
- compilation numérique chaque été (Summer Hits) ;
- soirées en péniche, en club (42 Marches) et en open air ;
- distribution par Subwax, présence chez des disquaires spécialisés DJ (Redeye, deejay.de, Yoyaku).

### 2.2 Identité relevée

Relevé fait sur la planche « relevé DA » du 10 octobre 2026 (sept pochettes, treize flyers), en attendant les fichiers du label.

**Deux marques.**

- Le **monogramme G2G** : deux G gras arrondis empilés, reliés par un 2 ; présent sur toutes les étiquettes de disque, recoloré par sortie (noir sur GTGR03, crème ou couleur de la pochette ailleurs). Sous le monogramme, « Groove To Grave Records » en grotesque gras sur deux lignes.
- Le **crâne coiffé d'un vinyle** : la mascotte, depuis GTGR04, sur les étiquettes, les compilations et les flyers.

**Style commun** à JeunePenard et LukasDarian : contour noir épais, aplats, papier crème, une couleur forte par pièce, rouge le plus souvent, vert ensuite. Le lettrage dessiné de chaque artiste (Kitchen Plug, Merov', Azbine, Emi Ömar) appartient à l'œuvre et n'est jamais imité.

**Logos provisoires.** En attendant les fichiers du label, les deux marques sont vectorisées fidèlement, sans rien redessiner : recadrage du G2G noir de l'étiquette GTGR03 et du crâne de l'étiquette GTGR05 en pleine résolution, seuillage, potrace, SVG une couleur en `currentColor`, nettoyage minimal des nœuds parasites. Fichiers dans `src/components/experience/groove-to-grave/ui/logos/`, chacun commençant par un commentaire `PLACEHOLDER-TRACE` avec sa source, à remplacer par les fichiers du label. Le favicon de l'expérience vient du monogramme. Une planche « logos » montre source et tracé côte à côte, puis chaque marque en ink, red et green sur wall et poster.

Une règle survit à tout remplacement : **les couleurs de chaque cassette sont extraites de la pochette réelle de sa sortie** (couleur dominante pour la coque, couleur d'accent pour la bande de l'étiquette). Le site prolonge leur DA mécaniquement, sortie par sortie.

---

## 3. Système de design

### 3.1 Couleurs

Fichier unique : `src/components/experience/groove-to-grave/tokens.ts`, exposé en variables CSS. Plus aucun placeholder : palette relevée sur les pochettes et les flyers.

| Token | Valeur | Usage |
|---|---|---|
| `wall` | `#efe6d2` | fond du mur (papier d'affichage) |
| `poster` | `#faf4e6` | affiches, étiquettes de cassette, texte clair sur fonds sombres |
| `ink` | `#111111` | texte, traits, contours |
| `red` | `#f14442` | aplats et éléments graphiques (relevé sur GTGRVA01) |
| `redInk` | `#c21e19` | texte rouge sur fond clair |
| `green` | `#268459` | aplats et éléments graphiques (relevé sur GTGRVA02) |
| `greenDeep` | `#1d6b47` | fond vert sous texte clair |
| `chrome` | `#e4dccb` | corps du lecteur |
| `chromeLight` | `#f3ecdc` | boutons, barres |
| `lcd` | `#111111` | fond de l'afficheur |
| `lcdLit` | `#f6efe0` | segments allumés, texte de l'afficheur |
| `lcdPeak` | `#f14442` | segments de crête |
| `lcdOff` / `lcdDim` | `#2a2722` / `#8a8270` | segments éteints, libellés de l'afficheur |
| `lambeauRouge` / `lambeauVert` | wall mêlé de red / de green à 35 % | lambeaux d'affiches du mur WebGL, dérivés dans `tokens.ts` |
| `papierSombre` | wall × 0,78 − 0,035 | grain le plus sombre du papier du shader, dérivé dans `tokens.ts` |

Règles de contraste, vérifiées au token près par `tokens.test.ts` :

- Le texte posé sur `wall`, `poster`, `chrome` ou `chromeLight` est en `ink`.
- `red` et `green` servent aux aplats et aux éléments graphiques, jamais en texte sur `wall` ou `poster`. Le texte rouge sur fond clair est en `redInk`, qui doit atteindre 4,6:1 sur `wall` (valeur finale `#c21e19` : 4,84:1 sur `wall`, 5,48:1 sur `poster`).
- Le texte clair (`poster`) sur fond vert se pose seulement sur `greenDeep`. `ink` sur `red` est autorisé.
- `lcdLit`, `lcdDim` et `lcdPeak` se posent sur `lcd`.
- Focus en double anneau `ink` et `red`.
- Chaque paire texte/fond utilisée est listée dans `tokens.ts`, et le test vérifie qu'elle atteint 4,5:1 (3:1 pour le texte de 24 px et plus et pour les éléments d'interface).

### 3.2 Typographies

Trois familles confirmées par la passe d'identité, auto-hébergées via `next/font`, sous-ensemble latin, `font-display: swap`. Seule la première est préchargée.

1. **Archivo**, variable en largeur et en graisse. En largeur condensée et graisse 800 à 900, elle sert au titrage affiche (noms d'artistes, références, gros titres). En largeur normale et graisse 400 à 500, elle sert au texte courant. Chiffres tabulaires pour toutes les métadonnées.
2. **Permanent Marker**, réservée aux étiquettes de cassette et aux annotations. Jamais plus de 6 mots, jamais pour une information qui n'existe pas aussi en texte normal (nom accessible, attribut `aria-label` ou texte voisin).
3. **VT323**, réservée à l'afficheur du lecteur et à rien d'autre.

### 3.3 Le désordre volontaire, et ses règles

Le désordre est un calque visuel posé sur une structure parfaitement ordonnée :

- **Rotations** entre −4° et +4°, calculées par un aléa déterministe à partir de l'identifiant de l'élément, jamais `Math.random()` au rendu (pour ne pas casser l'hydratation). Les blocs de texte de plus de deux lignes ne sont jamais tournés.
- **Stickers** : au maximum un par carte. Ils ne recouvrent jamais un texte et ne sont jamais le seul porteur d'une information (« sold out » et « no repress » sont aussi des statuts dans les données et dans le texte accessible).
- **Chevauchements** : aucun entre cartes, ni sur desktop ni sur mobile. Seuls le scotch et les stickers débordent, sur le mur uniquement, jamais sur une autre carte ni sur une zone cliquable (passe de direction 4.1 ; gouttières de 16 px au moins, débord de 12 px au plus).
- **Ordre du DOM = ordre de lecture visuel**, de haut en bas et de gauche à droite.
- **Scotch, traces de colle, papier déchiré** : uniquement en décor (CSS ou WebGL), `aria-hidden`.
- Sur mobile, le mur devient une pile : rotations divisées par deux (`--rot-facteur: 0.5` sur la racine), pas de chevauchement.
- **Empilement** : une seule échelle de `z-index`, en variables sur la racine : mur WebGL 0, contenu 1, stickers et scotch 2, skin et barres mobiles 50, cassette en vol 60, menu et feuille mobiles 70.

### 3.4 La cassette (composant central)

- SVG en ligne (`aria-hidden`), proportions de la maquette.
- Coque, étiquette et bande de l'étiquette colorées depuis la pochette.
- Référence en titrage dans la bande, artiste et titre au marqueur sur l'étiquette.
- **Deux cibles distinctes** : la cassette elle-même est un lien vers la page de la sortie (fonctionne sans JavaScript), et un bouton rond « écouter » posé dessus lance la lecture (rendu seulement si JavaScript est actif).
- Les bobines tournent uniquement quand cette cassette joue, à une vitesse liée au BPM de l'extrait, et s'arrêtent en mouvement réduit.
- Le bouton « écouter » n'est rendu que si la sortie a au moins une piste avec un extrait (voir §4.1 et §7) : une cassette sans extrait reste un lien.
- Variantes :
  - **sortie vinyle**, avec mention « 12″ vinyle » visible à côté de la cassette : on vend des disques, la cassette est l'objet d'écoute ;
  - **EP numérique** de la série GTGR (GTGR01, *Common Speed EP*), même cassette avec la mention « EP numérique » ; chaque cassette porte son vrai format, lu dans `format` ;
  - **compilation**, en mixtape avec liste des titres écrite à la main au dos ;
  - ~~**soirée**~~ : abandonnée dès le bloc 2.1 au profit du mur de flyers réels ; une soirée sans visuel reçoit une affiche typographique (date en très grand, lieu dessous, mention « visuel non retrouvé ») ;
  - **vierge**, pour la page contact (« envoie ta tape »).

### 3.5 Le lecteur (skin)

- Skin **dessiné comme les étiquettes du label** : contour `ink` de 2 à 3 px et aplats `chrome`, `red` et `green`, sans biseau gris, sans dégradé ni ombre portée, sans rendu photoréaliste. Deux ou trois stickers et une signature au marqueur collés dessus.
- **Barre de titre** : le monogramme G2G et un bouton fonctionnel de passage en mode mini.
- **Barre de menu** : la navigation principale (voir §4).
- **Afficheur** :
  - la bande défilante en VT323 ;
  - le spectre en segments, 32 colonnes (6 segments dans 30 px à l'implémentation, §13.2), en DOM (colonnes `scaleY` avec masque à segments), pas de second canvas, mis à jour à 30 images par seconde au plus et arrêté quand rien ne joue ;
  - les compteurs SORTIES (nombre de sorties dans le filtre courant), PISTE et TEMPS (temps écoulé, durée réelle de l'extrait) ;
  - la ligne des presets HOUSE, BREAK, MINIMAL, ELECTRO et TOUT.
- **Fenêtre cassette** : un emplacement dans le skin où la cassette chargée apparaît, bobines visibles.
- **Barre de progression** (cliquable pour se déplacer dans l'extrait) et **transport** : précédent, stop, lecture et pause, suivant, volume.

### 3.6 Mouvement

- Une seule horloge : un ticker en `requestAnimationFrame` natif (`lib/ticker.ts`, même contrat que celui de la-coupe), qui ne tourne que s'il a des abonnés. Lenis sur le document comme dans la-coupe, chargé à l'inactivité après le premier rendu (Phase 6).
- Arrivée des éléments du mur au défilement : un « collage » court (échelle 1,06 vers 1, rotation qui se pose, 220 ms), une seule fois par élément, sans effet de parallaxe.
- **Tout ce qui bouge en continu bouge parce que la bande tourne.** La bande défilante, les bobines, le spectre et la respiration du mur sont arrêtés quand rien ne joue. C'est un choix de concept (la bande ne défile que quand elle tourne) et la réponse au critère WCAG 2.2.2 : l'utilisateur contrôle le mouvement par la lecture.
- En mouvement réduit : bande défilante statique (texte tronqué avec points de suspension, texte complet dans l'attribut `title` et dans la région annoncée aux lecteurs d'écran), pas de rotation des bobines, transitions en fondu simple de 150 ms, mur figé.

### 3.7 Design sonore

Aucun son avant un geste de l'utilisateur, jamais d'autoplay. L'`AudioContext` est créé au premier clic sur un contrôle audio : ce premier geste crée le contexte, le reprend et lance la lecture de façon synchrone dans le gestionnaire de clic (exigence iOS).

**iOS.** La lecture au travers du graphe Web Audio s'arrête quand l'écran se verrouille ou que Safari passe en arrière-plan ; c'est accepté. La Media Session reste en place. Sur `visibilitychange` et sur `statechange` de l'`AudioContext`, l'état du lecteur passe honnêtement en pause (afficheur, bouton, bobines) et la reprise se fait au geste suivant, jamais automatiquement.

| Événement | Son | Niveau |
|---|---|---|
| Insertion ou lecture | « clac » mécanique, puis démarrage de bande légèrement pleurard (environ 0,5 s) | −14 dB |
| Pause ou stop | « clac » | −14 dB |
| Changement de page | avance rapide (sifflement de bande qui monte, souffle) puis « clac », musique abaissée puis remontée, jamais coupée | −16 dB |
| Retour au début (fin de bande) | rembobinage | −16 dB |
| Lecture | souffle de bande très léger mêlé à l'extrait | −34 dB |

- Pas de son au survol, pas de son sur les boutons de preset.
- Les sons d'interface sont synthétisés en Web Audio (poids nul) à partir de la maquette, puis réglés à l'oreille.
- Réglages persistés en `localStorage` (encadré par try/catch) : volume général, coupure générale, coupure des sons d'interface seuls.
- **Media Session API** : titre, artiste, pochette et actions précédent, lecture, pause, suivant, pour l'écran verrouillé du téléphone et les touches média.

---

## 4. Architecture des pages

Route : `src/app/experience/groove-to-grave/`. Le lecteur vit dans `layout.tsx` de ce segment, ce qui le garde persistant entre toutes les pages de l'expérience.

| Page | Chemin | Contenu |
|---|---|---|
| Accueil | `/` | Bande défilante d'accueil. Grande cassette de la dernière sortie (GTGR05) avec texte de sortie et liens. Mur de toutes les cassettes, dans l'ordre de `/sorties`. Bloc soirées (prochaine date ou état vide). Phrase du label. Newsletter. Fin de bande. |
| Sorties | `/sorties` | Mur de cassettes, filtrable par les presets du lecteur, synchronisés dans l'URL (`?genre=house`), donc partageables et fonctionnels sans JavaScript via de simples liens. La série GTGR du plus récent au plus ancien, vinyles et EP numérique ensemble, puis les compilations. Le search param est lu par la page serveur et poussé dans le store par un petit composant client de page ; le lecteur ne lit jamais les search params. |
| Sortie | `/sorties/[ref]` (`gtgr05`, `gtgrva02`…) | Bandeau de tête dans la couleur dominante de la pochette, texte en `ink` ou `poster` selon `contrasteInk` et `contrastePoster`. **Pochette réelle en grand**, intacte. Référence, artiste, titre, date, format réel (« 12″ vinyle », « EP numérique », « compilation numérique »). Faces A et B avec durées. Bouton écouter par piste, seulement pour les pistes qui ont un extrait (§7). Texte de sortie (langue d'origine). Crédits complets (artwork, mastering, distribution). Statut (« no repress », « sold out ») en texte et en sticker. Lien d'achat Bandcamp. Sorties voisines. |
| Artistes | `/artistes` | Les noms en typographie d'affiche collée, un par affiche. |
| Artiste | `/artistes/[slug]` | Nom, ville, présentation factuelle tirée des textes publics, sorties sur le label, liens publics. Aucune biographie inventée. |
| Soirées | `/soirees` | **À venir** : billetterie en lien externe (Shotgun ou RA), classement par la logique de date (une soirée passe en archive le lendemain sans changement de contenu). En l'absence de date, un état vide soigné (« aucune date annoncée, reste branché » avec newsletter et Instagram), il doit être beau. **Passées** : mur de flyers réels collés au scotch, jamais recadrés, rotation de 2° au plus sur le support entier, avec date, lieu et line-up en texte à côté, et les mentions (reportée, annulée). Sans flyer récupéré, une affiche texte dans le même cadre. |
| Le label | `/label` | Qui (les trois, leurs rôles réels d'après les crédits), pourquoi (texte `draft` dans leur ton, à faire valider), chronologie des sorties et des soirées, **comment proposer une démo** (procédure en `draft` : lien d'écoute privé, pas de fichier joint, délai de réponse à faire valider). |
| Contact | `/contact` | Contacts (adresse à obtenir du label, en attendant le lien Instagram), newsletter, cassette vierge « envoie ta tape ». |

**Navigation.** Barre de menu du lecteur, avec icône et libellé texte pour chaque entrée : sorties, artistes, soirées, le label, contact. Ce sont de vrais `<Link>` dans un `<nav aria-label="Navigation principale">`, page courante en `aria-current="page"`. Le logo ramène à l'accueil.

**Pied de page, « fin de bande ».** Gardée par le crâne coiffé d'un vinyle. Crédit « Site réalisé par Julien Robert pour Groove To Grave Records », droits des œuvres (JeunePenard, LukasDarian, Cbrgraphics), lien vers les sources, liens Bandcamp, SoundCloud, Instagram, Discogs et Linktree. Un bouton « rembobiner » ramène en haut de page avec le son de rembobinage.

**Newsletter.** Le formulaire est conçu et passe par une server action qui valide l'adresse, mais **n'enregistre rien** tant qu'aucun fournisseur n'est choisi avec le label. Le message de confirmation le dit honnêtement. Un lien « suivre sur Bandcamp » fonctionne réellement à côté.

### 4.1 Contenu

Tout le contenu typé est dans `src/components/experience/groove-to-grave/content/`, comme dans la-coupe, en TypeScript (`releases.ts`, `artists.ts`, `events.ts`, `label.ts`, `types.ts`, `index.ts`). Chaque entrée porte :

- `sources: string[]`, les URL publiques ;
- `verified: boolean` ;
- `draft: true` pour tout texte de notre main.

`content/groove-to-grave/` à la racine du repo ne contient pas de code : `sources.md` (sources et ce qui reste à vérifier). Jusqu'à la Phase 7.4 il contenait aussi `media/source/`, `sources.json`, `media/label/` et `media/rapport.md` ; les originaux et leurs dérivés vivent désormais dans Sanity (§7).

**Extraits.** Chaque piste porte un extrait optionnel. Depuis la Phase 7.4, les champs réels sont ceux des documents Sanity (`extrait`, `extraitDuree`, `sonie`, `bpm`, `extraitProvisoire`) ; le modèle `excerpt?: { src, duration, provisional }` décrit ci-dessous est antérieur. Les extraits provisoires synthétisés ne sont attribués qu'à la piste A1 de chaque sortie ; les autres pistes n'affichent pas de bouton écouter tant qu'aucun vrai extrait n'existe.

État relevé au 8 octobre 2026, à reprendre et compléter depuis les pages sources en phase 1 :

**Sorties**

- **GTGR02** — Azbine, *Spacy Taste EP*, 12″, 7 juillet 2023. A1 If This Wall Could Talk, A2 Boarding Pass, B1 Spacy Taste, B2 She Gave Me Flavour. Artwork JeunePenard, distribution Subwax. Vinyle épuisé. Premier vinyle du label ; duo lyonnais d'amis d'enfance, créé en 2018.
- **GTGR03** — Kitchen Plug, *Cerberus EP*, 12″, 24 mai 2024. Quatre titres dont *Melee (Karaba Remix)* ; tracklist complète à relever. Artwork JeunePenard, mastering Benoit D. (Perception Mastering), distribution Subwax. Trio parisien.
- **GTGR04** — Emi Ömar, *Homo Musicus EP*, 12″. A1 Chut Hello, A2 Primate Groove, B1 Grrrr, B2 Are You Homo Musicus?. Date, artwork et crédits à relever.
- **GTGR05** — Merov', *Interdimensional Groove EP*, 12″, 13 mai 2026 sur Bandcamp. A1 UFO Catcher (7:49), A2 Swing Interstellaire (6:03), B1 Spirit Spaceship (5:50), B2 Big Band Bang (6:01). Artwork JeunePenard, mastering Benoit D. (Perception Mastering), distribution Subwax. Pressage limité, sans repress.
- **Summer Hits Vol.1** — compilation numérique, 4 juillet 2025, sélectionnée en New & Notable par Bandcamp le 23 octobre 2025. Tracklist à relever.
- **Summer Hits Vol.2** (GTGRVA02) — compilation numérique, 17 juillet 2026. Lungo, I Met A Girl ; Yotam Nadav, If You Funk To ; Kitchen Plug ft. l'Abominable, Texas Megachurch ; Crâne De Poule, Fierté Mal Placée ; Phyto, Cereja ; LukasDarian, 7$ Left ; Gregs, Time ; Atay, Source Of Trouble. Artwork LukasDarian, mastering Gregs, A&R Jules Fritsch.

Les genres utilisés par les presets sont **déduits** des descriptions publiques et marqués `verified: false` :

| Sortie | Genres déduits |
|---|---|
| GTGR02 | minimal, house |
| GTGR03 | break |
| GTGR04 | electro, house |
| GTGR05 | house, electro |

**Soirées passées**

| Date | Lieu | Détail |
|---|---|---|
| 7 janvier 2023 | Liebe, Paris 9e | Première soirée, gratuite, thème PLAISIR |
| 22 février 2023 | 45 Tours / L'Exode, Paris 10e | Crew au complet, expo de la graphiste Hannah Uzan |
| 4 novembre 2023 | Péniche Cinéma – Le Baruda, Paris 19e | Burnin' Ship, avec Kitchen Plug |
| 13 juillet 2024 | Péniche Marcounet | Soirée invitée par la péniche |
| 31 août 2024 | La Rotonde Stalingrad | Attrape Rave, avec Itinérairebis et Kpich |
| 1er novembre 2024 | 42 Marches | Annulée |
| 7 février 2025 | Lieu non retrouvé | Emi Ömar b2b Gregs, Alyhas, Pink Mermaids |
| 19 avril 2025 | — | Vinyle Village, The Diggers Temple |
| 25 juillet 2025 | Jardin21 | Open air, entrée libre, avec Foxin et Local DJ |
| Date à vérifier | Péniche Marcounet | Danza To The Grave |
| 19 décembre 2025 | Le Wagon Bleu | Midnight Express |
| 9 janvier 2026 | 42 Marches | Extended, line-up à vérifier |

Aucune soirée à venir n'est annoncée publiquement à ce jour.

---

## 5. Interactions signature

1. **L'insertion.** Le bouton écouter d'une cassette fait voler la cassette du mur jusqu'à la fenêtre du lecteur (animation FLIP via GSAP, 450 ms). Puis le « clac », le démarrage pleurard de la bande, et l'afficheur qui s'allume. En mouvement réduit, la cassette apparaît directement dans la fenêtre.
2. **La bande au tempo.** La bande défilante annonce ce qui joue (référence, artiste, piste, format, lien Bandcamp, puis la prochaine soirée ou l'état « aucune date »), à une vitesse proportionnelle au BPM. Elle s'arrête quand la lecture s'arrête et se met en pause au survol et au focus.
3. **Les presets.** HOUSE, BREAK, MINIMAL, ELECTRO et TOUT forment un seul état partagé par le lecteur et la page sorties :
   - ils filtrent le mur (nombre de résultats annoncé aux lecteurs d'écran, URL mise à jour) ;
   - ils appliquent une courbe d'égalisation audible (réglages de départ ci-dessous, à affiner à l'oreille).

   | Preset | Graves (110 Hz) | Médiums (1,2 kHz) | Aigus (6 kHz) | Passe-haut |
   |---|---|---|---|---|
   | TOUT | 0 dB | 0 dB | 0 dB | 20 Hz |
   | HOUSE | +7 dB | −1 dB | −1 dB | 20 Hz |
   | BREAK | +2 dB | +6 dB | +2 dB | 20 Hz |
   | MINIMAL | −6 dB | −2 dB | +4 dB | 180 Hz |
   | ELECTRO | +3 dB | −4 dB | +7 dB | 20 Hz |

   La normalisation de gain évite qu'un preset paraisse « mieux » parce que plus fort — par une table mesurée preset par preset, pas par une marge fixe (§13.1) ; un `DynamicsCompressorNode` réglé en limiteur, juste avant le gain général, rattrape les crêtes du preset HOUSE.
4. **L'avance rapide.** Une navigation interne déclenche l'avance rapide sonore, une distorsion de bande (bandes horizontales de suivi, décalage chromatique léger) dans le canvas WebGL pendant 400 ms, et la révélation du nouveau contenu par un balayage horizontal. Elle reprend le mécanisme de transition de la-coupe, avec un rendu entièrement nouveau. La lecture continue sans coupure.
5. **Le mur qui respire.** Un canvas WebGL2 brut plein écran derrière le contenu, un quad et un fragment shader, dessine le mur : papier, grain, couches d'affiches déchirées, traces de colle. Quand la musique joue, l'énergie des graves fait « respirer » le papier (déplacement de quelques pixels au maximum) et les attaques de grosse caisse le font légèrement trembler. Aucun mouvement quand rien ne joue.
6. **Mini, barre mobile et écran verrouillé.** Le bouton de la barre de titre passe le lecteur en mode mini (bande défilante, fenêtre cassette, lecture). Sur mobile, le lecteur est toujours en barre basse, et la Media Session prend le relais sur l'écran verrouillé.
7. **Fin de bande.** Quand le pied de page entre dans l'écran, l'afficheur affiche « FIN DE BANDE » à la place des compteurs, et le bouton rembobiner ramène en haut de page.

---

## 6. Stack

- Next.js 16 App Router, React 19, TypeScript strict, npm, Vercel : l'existant du repo.
- Conventions de la-coupe reprises : Lenis, **un seul canvas WebGL**, transitions de page, repli sans WebGL et en mouvement réduit, images AVIF et WebP générées par le bloc d'export du script existant, contenu typé dans le dossier `content/` du composant. Le curseur personnalisé de la-coupe n'est **pas** repris : ici, le curseur système va mieux avec le chrome imprimé.
  - `lenis-store.ts` et `use-page-settled.ts` sont **dupliqués** depuis `la-coupe/lib/` dans `groove-to-grave/lib/`, chaque copie avec un commentaire d'origine en tête de fichier. La-coupe n'est pas modifiée. **Écart de Phase 6** : `ticker.ts` est un ticker natif et `gsap.ts` un chargeur à la demande (GSAP ne sert qu'aux tweens de l'insertion et de la transition, sans ScrollTrigger) : GSAP et Lenis sortent du JavaScript initial, préchargés à l'inactivité.
  - Dans la copie du store de navigation, le repli quand aucun navigateur n'est enregistré utilise `router.push`, jamais `window.location.assign` : un rechargement complet couperait la lecture.
  - **Écart volontaire** : le mur n'utilise ni three ni fiber (environ 235 kB pour un rendu 2D). WebGL2 brut, un seul canvas, un quad plein écran, un fragment shader, module chargé après le LCP. Repli statique AVIF si WebGL2 est absent ou si le contexte est perdu.
- **Audio** : Web Audio API native, sans bibliothèque.
  - Un seul `HTMLAudioElement` persistant, créé par un singleton de module hors React (le `MediaElementAudioSourceNode` ne se crée qu'une fois par élément), branché sur la chaîne d'égalisation (graves, médiums, aigus, passe-haut), un gain de normalisation par table mesurée (§13.1), l'analyseur, un `DynamicsCompressorNode` en limiteur, le gain général, la sortie.
  - Les sons d'interface passent par un gain séparé.
  - Les extraits viennent du **CDN Sanity** avec `crossOrigin="anonymous"` depuis la Phase 7.4, et sont analysés (livraison validée sur iPhone réel) ; la même origine reste une option, voir §7 ; les lecteurs Bandcamp et SoundCloud intégrés ne sont pas analysables. Format MP3 192 kbps, `preload="none"`.
- **État du lecteur** : stores de module et `useSyncExternalStore`, le motif déjà en place dans la-coupe (`hero-store.ts`, `navigation-store.ts`, `use-reduced-motion.ts`). Pas de contexte React, pas de dépendance. Les search params ne sont lus que par les pages serveur (§4).
- **Couleurs des cassettes** : extraites avec `sharp` (`stats().dominant` dans le disque inscrit, plus une couleur d'accent), écrites par le pipeline dans les champs en lecture seule des documents Sanity depuis la Phase 7.4, et vérifiées pour le contraste avec `ink`. `sharp` reste une dépendance transitive de Next, utilisée comme dans `fetch-la-coupe-photos.ts`.
- **Extraits provisoires** : synthèse en TypeScript pur hors navigateur dans `scripts/g2g-extraits.ts`, qui rejoue les recettes de la maquette (grosse caisse, charley, basse, souffle, égalisation) échantillon par échantillon, une boucle distincte par sortie (BPM, motif de grosse caisse, ligne de basse), de 45 s, avec fondus, écrite en WAV puis encodée en MP3 192 kbps par `ffmpeg`. Pas de Playwright. **Aucune question de droits.** Les vrais extraits n'entrent qu'avec l'accord du label (§7).
- **Médias réels** : `scripts/g2g-fetch-media.ts` récupère les pochettes publiques (Bandcamp) et les visuels d'événements publics (Shotgun, RA) vers `content/groove-to-grave/media/source/`, avec un `sources.json` qui donne l'URL d'origine, la date et les dimensions. Ce qui échoue est listé pour capture manuelle. Instagram n'est **jamais** aspiré par script. `scripts/g2g-media.ts` résout chaque emplacement selon la priorité du §7 et écrit `content/groove-to-grave/media/rapport.md`.
- **Une seule dépendance ajoutée au portfolio depuis la décision de Phase 0** : `next-sanity` (Phase 7.3), qui apporte `@sanity/client` ; `sanity` et `styled-components`, pairs optionnels, ne sont pas installés. Le dossier `studio/` a les siennes, hors du bundle et des dépendances du portfolio.
- **Autonomie et extractibilité** (audit du bloc 7.0, sans rien couper) : tout ce qui est propre à G2G vit dans `src/components/experience/groove-to-grave/` (composants, contenu, styles, polices, tokens), `src/app/experience/groove-to-grave/` (route), `scripts/g2g-*.ts`, `public/experience/groove-to-grave/`, `content/groove-to-grave/` et `docs/groove-to-grave/`. Attaches au reste du portfolio, à couper le jour d'une application Next indépendante : le hook `@/lib/use-reduced-motion` (3 imports, à copier dans `lib/`) ; le layout racine du portfolio (`src/app/layout.tsx` : `<html lang>`, `globals.css`, polices Geist, curseur, en-tête et pied conditionnels masqués par `IMMERSIVE_PREFIXES` de `src/lib/routes.ts`) à remplacer par un layout racine propre ; le préfixe `BASE` de `lib/routes.ts` et les chemins publics en dur (`content/extraits.ts` généré, `ui/photo.tsx`, `styles/g2g.css`, `store/lecteur-store.ts` pour la Media Session, les scripts) à ramener à la racine ; les chemins relatifs de `next/font/local` dans le layout ; les dépendances à déclarer dans un `package.json` propre (`gsap`, `lenis`, `sharp`, `tsx`, config ESLint et `tsconfig` avec l'alias `@/*`) ; le script `test:g2g-tokens` ; la variable `G2G_URL_SITE`. Restent côté portfolio seulement : l'entrée `accents.ts`, l'entrée de `seed.ts`, `scripts/g2g-upsert-projet.ts` et la tuile. Aucune dépendance à Prisma ni à la base.

---

## 7. Médias fournis par le label

Le site est conçu pour recevoir, sans changement de code, les fichiers que Groove To Grave Records voudra bien fournir.

> **Depuis la Phase 7.4 (12 octobre 2026), les médias viennent de Sanity.** Le label dépose ses fichiers d'origine dans le Studio (pochette, flyer, portrait, extrait audio brut d'une piste) ; le pipeline `scripts/g2g-pipeline-sanity.ts`, lancé par l'Action GitHub `g2g-pipeline-medias.yml` (toutes les 15 minutes, à la demande, ou par `repository_dispatch`), applique les règles ci-dessous et écrit les champs en lecture seule des documents : AVIF et WebP sans recadrage pour chaque largeur de 320 à 1600 px (chaque fichier sous 300 kB), couleurs de cassette et contrastes, extrait de 60 s dès 30 % du morceau, fondus de 2 s, MP3 192 kbps à −14 LUFS, sonie mesurée, BPM estimé, refus d'une sortie non parue avec raison ; l'état (« en attente », « en cours », « prêt », « refusé ») est visible dans l'onglet Automatique, et une empreinte par fichier d'origine évite tout retraitement inutile. Le site lit ces champs (`sanity/requetes.ts`, `adaptateur.ts`) et sert tout depuis `cdn.sanity.io` (origines déclarées dans les CORS du projet : le CDN d'un dataset privé refuse sinon les requêtes `crossOrigin`, dont l'audio analysé). **Règle : toute origine qui sert le site doit figurer dans `sanity cors list` avant sa mise en ligne — le domaine final du label le jour où il est choisi, en même temps que `G2G_URL_SITE` et le retrait du `noindex`. Sans cela les images s'affichent encore (elles ne portent pas `crossOrigin`) mais le lecteur reste muet : le CDN refuse l'audio analysé.** Origines déclarées à ce jour : production Vercel, preview de la branche, `localhost:3999`. Les boucles synthétiques provisoires ont été posées une fois comme extraits traités (`extraitProvisoire`), remplacées dès qu'un fichier est déposé. Le contenu TypeScript (`content/*.ts` hors `types.ts` et `presets.ts`), `content/groove-to-grave/media/`, `sources.json` et les dérivés sous `public/experience/groove-to-grave/img|audio` (hors tuile et mur) ont été retirés ; les paragraphes **Dépôt** et **Git** ci-dessous décrivent l'organisation d'avant 7.4. Jeton d'écriture `SANITY_PIPELINE_TOKEN` (rôle editor) dans les secrets GitHub et `.env.local`, jamais dans le dépôt ; en local le script peut utiliser la session de la CLI.

**Priorité par emplacement média.** Pour chaque emplacement (extrait de piste, pochette, flyer de soirée, photo d'artiste, photo du label), dans l'ordre : fichier fourni par le label, sinon fichier public récupéré par script, sinon provisoire. `scripts/g2g-media.ts` applique cette règle et écrit dans `content/groove-to-grave/media/rapport.md`, pour chaque emplacement, la source retenue.

**Dépôt.** `content/groove-to-grave/media/label/audio/` et `content/groove-to-grave/media/label/images/`, décrits par `content/groove-to-grave/media/label/manifest.json`. Le manifeste associe chaque fichier à un identifiant : une sortie (`gtgr05`), une piste (`gtgr05-a1`), une soirée (sa date ISO, `2026-01-09`) ou un artiste (son slug). Pour l'audio, un point de départ d'extrait optionnel en secondes. Un `README.md` dans `label/` rappelle ces conventions.

**Git.** Les originaux du dossier `label/` sont exclus de git (`.gitignore`) ; seules les sorties traitées sous `public/experience/groove-to-grave/` sont commitées.

**Audio.** Uniquement des extraits de morceaux déjà sortis : 60 s par défaut, départ à 30 % de la durée si non précisé, fondus de 2 s, MP3 192 kbps normalisé à −14 LUFS. Un fichier marqué inédit dans le manifeste, ou rattaché à une piste dont la sortie n'a pas de date passée, est refusé par le script.

**Images.** Jamais retouchées ni recadrées au-delà du format d'origine ; seulement les déclinaisons AVIF et WebP aux largeurs du script.

**Modèle de données.** Un extrait optionnel par piste. Les extraits provisoires ne sont attribués qu'à la piste A1 de chaque sortie ; les autres pistes n'affichent pas de bouton écouter tant qu'aucun vrai extrait n'existe.

---

## 8. Performance, accessibilité et mobile — non négociables

**Performance**

- Lighthouse ≥ 95 sur les quatre axes, desktop et mobile, sur l'accueil, `/sorties`, `/sorties/gtgr05` et `/soirees`. Audits **séquentiels**. C'est le critère bloquant. **Mesure de référence** (bloc 6.1) : la preview Vercel, mobile simulé, cinq passages par page l'un après l'autre, médiane retenue ; la mesure sur le build local reste indicative.
- **Exception assumée du critère SEO** : le site reste en `noindex` tant que le domaine final n'est pas choisi (§12), pour ne pas indexer une adresse qui changera ; l'audit `is-crawlable` échoue et plafonne le SEO vers 66, tout le reste de l'axe passe. Avec la décision : poser `G2G_URL_SITE` (origine canonique, sans barre finale) sur Vercel, retirer la ligne `robots: { index: false, follow: false },` de `src/app/experience/groove-to-grave/layout.tsx`, et le SEO revient à 100.
- LCP < 2,5 s en mobile simulé, CLS < 0,02, TBT < 150 ms.
- **Préchargement de l'image LCP (bloc 7.4b)** : toute page dont l'élément LCP est une image la marque `priority` sur `<Photo>`, qui pose alors dans le head un `<link rel="preload" as="image">` portant **exactement** le même `imagesrcset`, le même `imagesizes` et `fetchpriority="high"` que la source AVIF de son `<picture>`, et met l'image en `loading="eager"` ; toutes les autres images restent en `lazy`. Les médias venant d'une autre origine (CDN Sanity), sans ce lien la requête part après la mise en page : 350 ms de retard mesurés. Un `imagesizes` qui ne correspond pas au `sizes` de l'image fait télécharger deux largeurs : les deux se posent au même endroit, dans `ui/photo.tsx`.
- **Géométrie identique avant et après l'hydratation** : aucune règle de mise en page ne dépend de `data-js` (posé au montage de React). Les commandes qui n'ont de sens qu'avec JavaScript gardent leur place (`visibility`), les variantes sans script passent par `@media (scripting: none)`, jamais par une classe posée par un script.
- **Score de la page sortie : 95 en médiane, arbitrage assumé (bloc 7.4c).** Les quatre pages de référence sont à 99, 99, **95**, 99 en performance mobile ; la page sortie reste sous l'objectif de 97 parce que son élément LCP est l'artwork en grand : sur le lien 4G simulé par Lighthouse, ce qui passe avant lui (document 17 kB, polices, CSS 16 kB, image 31 kB) borne le LCP vers 2,9 s, quelle que soit la façon dont l'image est demandée. Ce qui a été fait : préchargement déclaré dans le head (délai avant la requête 354 ms → 22 ms), une seule image téléchargée, VT323 sortie du chemin critique. Ce qui a été mesuré et **écarté** : servir les médias depuis notre propre origine par réécriture Next (aucun écart hors du bruit, un saut de plus, bande passante Vercel). Ce qui n'est **pas** pris, par choix : réduire la résolution de l'artwork ou ajouter une largeur intermédiaire (l'œuvre prime), différer Archivo (elle tient tout le texte visible), tailler le JavaScript inutilisé (150 ms annoncés, socle Next). Le critère bloquant reste ≥ 95 : il est tenu.
- **Police de l'afficheur hors du chemin critique (bloc 7.4c)** : `next/font` envoie un en-tête `Link: rel=preload` pour toute police d'une route, **même avec `preload: false`**. VT323 est donc déclarée à la main (`@font-face` « G2G LCD » dans `g2g.css`, fichier dans `public/.../polices/`, copié par `scripts/g2g-polices.ts`) et n'est appliquée que sous `[data-js]` : sans JavaScript elle n'est jamais demandée, avec elle arrive après le DOM prêt. `font-display: block` pour que l'afficheur n'apparaisse pas d'abord dans la monospace du système. Contrôlé par `g2g-verif` (la police doit être demandée après le LCP et après le DOM prêt).
- Le WebGL s'initialise après le LCP, pendant un temps libre du navigateur, et le shader se compile en parallèle sans bloquer le fil principal. DPR plafonné à 1,5 (1 sur mobile), pause quand l'onglet est caché.
- Aucun extrait audio chargé avant un geste. Trois fichiers de police au maximum, seul Archivo est préchargé.
- Audits : `scripts/g2g-lighthouse.ts` (build de production local, `npx lighthouse`, mobile puis desktop, trois passages par page, médiane, rapports HTML hors du dépôt, dans `~/Desktop/g2g-sorties/lighthouse/`), `scripts/g2g-a11y.ts` (axe-core, clavier, aria-live, replis) et `scripts/g2g-verif.ts` (mise en page, lecture continue, exécution réelle du lecteur par quatre chemins d'arrivée, erreurs de console).
- **Archive de fin de phase** : toujours par `scripts/g2g-archive-phase.ts`, qui copie les fichiers dans un dossier temporaire hors du dépôt avant de zipper. Aucun outil du dépôt ne déplace ni ne supprime de fichier dans `docs/`.
- **Notre automatisation ne couvre pas WebKit (bloc 7.5a).** `g2g-verif`, `g2g-a11y`, les planches, les vidéos et Lighthouse tournent tous dans Chrome ; Playwright WebKit ne démarre pas de page sur cette machine et Safari n'est pilotable qu'avec « Autoriser l'automatisation à distance » activé à la main. **Conséquence, règle ferme : tout ce qui touche la livraison des médias (origine, CORS, Range, formats) ou le moteur audio n'est « fait » qu'après un essai sur un iPhone réel.** Les quatre chemins d'arrivée et les contrôles d'exécution de `g2g-verif` prouvent le comportement sur Chromium, pas sur WebKit. Page d'essai sur appareil : `public/experience/groove-to-grave/diagnostic.html` (hors du site, `noindex`), qui compare audio nu et Web Audio, CDN et même origine, et rend un résumé à recopier.
- **Livraison des médias : le CDN Sanity, directement (bloc 7.5b).** C'est la seule livraison validée sur iPhone réel (essais F, G et K sur appareil). L'option « même origine » (`G2G_MEDIAS_MEME_ORIGINE=1`, route `src/app/experience/groove-to-grave/media/[fichier]`) reste disponible pour le jour du domaine du label, mais **ne doit pas être remise par défaut sans un essai sur appareil**.
- **Incident non expliqué, clos (bloc 7.5, 12 octobre 2026).** Le 12 octobre vers 14 h 45, le lecteur était muet sur iPhone en production. Le build de ce moment-là était `5f59fee` (bloc 7.4b) : ni l'état d'échec du lecteur, ni les correctifs 7.4c, donc aucun message à l'écran et aucune trace exploitable. Tout ce qui a pu être vérifié depuis est sain : les quatorze adresses audio de la page sorties répondent 206 avec `access-control-allow-origin` pour l'origine de production, l'origine figure dans la liste CORS de Sanity et n'a pas changé, les fichiers existent, et la reproduction fidèle du lecteur sur appareil (essai K) joue. **Aucune cause ne subsiste ; l'incident est consigné comme non expliqué sur un build antérieur et le sujet est clos.** Ce qui en reste : l'état d'échec du lecteur (bloc 7.5a), qui ferait désormais parler un silence du même genre.
- **Textes en brouillon, décision de direction (Phase 7.6).** Tant que le site est en `noindex`, un texte écrit par nous et non validé s'affiche **avec sa mention « brouillon »** : c'est honnête, et c'est ce qui donne au label la liste de ce qu'il lui reste à relire. **Le jour du domaine final, aucun visiteur ne doit lire un marqueur de chantier** : `G2G_MASQUER_BROUILLONS=1` fait qu'un texte encore en brouillon n'est **pas publié du tout** — ni mention, ni contenu. Les pages tiennent sans eux, vérifié par planches aux deux formats (bloc 7.6) : une section dont le texte disparaît s'en va avec son titre, une section dont les liens valent par eux-mêmes les garde, et les mentions « brouillon » sont conditionnées au champ, jamais écrites en dur. `g2g-verif` contrôle désormais sur chaque page et chaque format qu'aucun titre ne reste orphelin et qu'aucune section visible n'est vide.
- **Durée d'une piste (Phase 7.6)** : stockée en secondes, saisie comme sur l'étiquette. Le composant du Studio accepte `3:42`, `3'42`, `1:02:30` ou `222`, affiche la relecture en minutes et secondes sous le champ, et refuse en français ce qu'il ne sait pas lire. Rien d'autre ne change : les 37 durées existantes ont été comparées avant et après, à l'identique.
- **Piège du cache de périphérie, et sa parade.** Vercel garde la **première** réponse d'une adresse ; or la première requête d'iOS sur un média est une sonde `Range: bytes=0-1`. Avec une simple réécriture, l'adresse restait figée sur deux octets (`206`, `content-range: bytes 0-1`), servis ensuite à toutes les requêtes complètes : le lecteur calait avec `networkState 2`, `readyState 0`, `stalled`, **sans aucune erreur**. Démontré sur une adresse neuve : `Range 0-1` → 206, 2 octets, MISS ; requête complète → **206, 2 octets, HIT** ; `Range 0-200000` → encore 2 octets. Sur une adresse déjà en cache complet, les plages sont au contraire servies correctement — d'où un comportement qui dépend de **qui a demandé le fichier en premier**, donc intenable en production. La route de relais y répond : une réponse partielle est renvoyée en `Cache-Control: no-store` (jamais mise en cache), une réponse complète en `public, max-age=31536000, immutable`. Une réécriture ne suffit pas : les en-têtes de la destination externe l'emportent sur ceux de `headers()` dans `next.config.ts` (vérifié).
- **Le registre public (Phase 7.7).** Le site publie un registre, pas un chantier. **Une information inconnue se tait, ou se dit « non retrouvé » — jamais « à vérifier », « à confirmer », « à compléter », « TODO » ni « ? »**, ni dans le contenu écrit par le label, ni en dur dans le code. La règle tient en trois endroits : `src/components/experience/groove-to-grave/lib/registre.ts` (source unique de l'expression et du libellé « Lieu non retrouvé »), la validation du Studio qui refuse ces formules à la saisie sur les champs publics avec un message en français (`studio/schemas/communs.ts`, qui importe la même expression), et un contrôle de `g2g-verif` qui repasse l'expression sur le **texte rendu** de chaque page, aux deux formats. Corollaire côté données : **un champ vide ne doit jamais faire disparaître un document** — l'adaptateur des soirées n'exige plus que la date, une soirée sans lieu reste au registre et le site écrit « Lieu non retrouvé ».
- **Une seule composition pour toute soirée affichée (Phase 7.9, qui généralise la chronologie de 7.7 et 7.8).** `lib/soiree.ts` compose titre et lieu, et **tout ce qui affiche une soirée passe par là** — chronologie du label, page soirées, archive, bloc des pages d'artistes, bande défilante : « Soirée » n'est ajouté que si le titre ne le porte pas déjà et reste seul quand il n'y a pas de titre ; **le lieu n'est jamais répété**, ni quand il est déjà dans le titre, ni quand le bloc l'écrit déjà à côté (l'affiche typographique d'une soirée sans flyer l'imprime en grand) ; aucun champ absent ne laisse de virgule. Chaque bloc rendu porte `data-soiree` et `data-lieu`, et **`g2g-verif` échoue si le lieu apparaît deux fois dans le texte d'un bloc**, sur toutes les pages et aux deux formats.
- **Les soirées sur les pages d'artistes (Phase 7.8).** Le gabarit artiste affiche, après les sorties, les soirées du label où l'artiste figure au line-up — date, nom, lieu, lien vers la soirée — **rendues seulement s'il y en a**. La correspondance est **exacte sur le nom normalisé** (sans accents, sans ponctuation, espaces réduits, minuscules) : aucune correspondance partielle, aucun rapprochement approximatif, parce qu'un faux rapprochement serait une invention. Conséquence assumée : « Emi Ömar b2b Gregs », « Lungo (RMP Soundsystem) » ou « Gregs b2b Julius » ne correspondent à personne. Relevé du 13 octobre 2026 : **13 correspondances pour 6 artistes sur 19**, et 36 noms de line-up distincts sans correspondance, qui sont de l'information pour le label, pas un défaut.
- **Écritures en base (Phase 7.7).** Aucune écriture dans Sanity sans accord explicite de Julien, **un champ à la fois**, avec relevé avant, relevé après, comptes de documents des deux côtés et retour arrière documenté (révision précédente notée, outil de retour conservé : `studio/outils/registre-releve.ts`, lancé par `npx sanity exec … --with-user-token`). Première application : le lieu de la soirée du 7 février 2025, qui portait « Lieu à vérifier », a été vidé.
- **Une seule charte d'en-tête d'artiste (Phase 7.7, couleur revue en 7.8 et 7.9).** Toutes les pages d'artistes portent la même affiche scotchée au nom. Le papier prend la **dominante relevée sur la pochette** par le pipeline. Si elle ne porte pas l'encre au seuil d'affiche, elle est **éclaircie à teinte constante** jusqu'à ce que le rapport soit atteint — la couleur de l'œuvre reste reconnaissable — avec la **saturation plafonnée à 55 %** et la **clarté à 92 %** pour que dix-neuf papiers éclaircis ne virent ni au néon ni au blanc. Si une dominante ne tient toujours pas dans ces limites (teinte quasi neutre), **la palette reprend la main** et le test le dit. `tokens.test.ts` passe les dix-neuf affiches réellement en service, lues dans l'instantané du contenu, et imprime dominante d'origine, papier retenu, rapport et origine. Mesure du 13 octobre 2026 : **7 dominantes telles quelles, 12 éclaircies, 0 de palette**. Huit pages partagent le même papier parce qu'elles partagent la même pochette (la compilation GTGRVA02), cinq de même pour GTGRVA01 : l'identité vient des données, pas de la règle. **Depuis la Phase 7.9, la dominante est la seule source de teinte de l'artiste, pour sa page comme pour sa tuile du mur des artistes** (plus de rotation de teintes par position) : deux tons sortent de la même teinte, l'affiche de la page à 4,5:1 parce qu'elle ne porte qu'un titre énorme, la tuile du mur à **7:1** parce qu'elle porte une ligne de 13 px sous le nom. Mêmes plafonds, même repli de palette en dernier recours, et `tokens.test.ts` passe **les deux tons des dix-neuf**.
- **Seuil de contraste du papier d'affiche : 4,5:1, et pourquoi (Phase 7.8).** Le brief impose 7:1 à l'encre sur les textures de mur, parce que ce sont des fonds bruités sur lesquels se pose du texte courant. Le papier d'affiche est un autre cas : **un aplat uni, échantillonné sur l'œuvre, qui ne porte qu'une seule chose — le nom de l'artiste, Archivo 900 en capitales, `clamp(64px, 11vw, 168px)`**. Pour ce texte-là, large et gras, le seuil retenu est **4,5:1**, c'est-à-dire déjà au-dessus des 3:1 que la norme accepte pour le grand texte : l'écart au 7:1 est délibéré et borné à ce seul usage. **Règle : aucun texte courant ne se pose sur un papier échantillonné.** Le jour où un petit texte y passerait, le seuil redevient 7:1 — et ce n'est pas à retenir : `g2g-verif` contrôle sur chaque page et chaque format que tout texte posé sur `.g2g-bande-titre` fait au moins 24 px et 600 de graisse, et échoue sinon. Pour information, au 13 octobre 2026, **aucun des dix-neuf papiers ne tiendrait 7:1** : il faudrait alors les éclaircir davantage ou sortir le texte de l'affiche.
- **Piège de mesure, à ne pas répéter (Phase 7.7).** Deux relevés ont été faussés le même jour par un **serveur local périmé** (un `npm run start` d'une session précédente tenait déjà le port, le nouveau échouait en silence) et par un **`.next` qui a resservi une page prérendue** alors que la source avait changé. Règle : avant toute mesure, tuer ce qui tient le port (`lsof -ti:3999`), reconstruire avec un `.next` supprimé, et vérifier dans la page servie une chaîne propre à la modification. Le port local est **3999** : c'est lui qui figure dans les CORS de Sanity, pas 3000, et le lecteur reste muet ailleurs.
- **Repli documenté, non implémenté : la lecture par tampon décodé.** Les essais I et J (bloc 7.5b) ont montré sur iPhone que `fetch` + `decodeAudioData` + `AudioBufferSourceNode` joue et alimente l'analyseur, depuis le CDN comme depuis notre origine. Si un jour l'élément `<audio>` routé dans Web Audio pose encore problème sur WebKit, c'est la solution de rechange : elle supprime toutes les requêtes de plage et tous les pièges de cache, au prix du téléchargement complet de l'extrait avant lecture (1 Mo pour 45 s) et de la perte de la lecture progressive. **Non implémentée** : l'essai K prouve que le lecteur actuel joue sur iPhone avec le CDN.
- **Règle de clôture (bloc 7.3b)** : une phase n'est terminée que lorsque `scripts/g2g-verif.ts` a été exécuté **contre l'URL de production** (`--url https://…`), après déploiement, et que son résultat complet figure dans le compte-rendu ; le lecteur doit y avoir été vérifié en fonctionnement réel par les quatre chemins d'arrivée, aux deux formats (URL directe, tuile depuis la home du portfolio, lien interne entre deux pages, retour puis avance du navigateur : lecteur monté, AudioContext en `running` au premier vrai clic, position qui avance, spectre qui bouge, aucune erreur de console). Un contrôle en local ou en headless sur chargement direct ne suffit pas : c'est ainsi que l'absence de `data-js` à l'entrée par navigation côté client (présente depuis la Phase 2, visible depuis la tuile du bloc 7.1) est passée au travers de toutes les planches et vidéos.
- Le spectre en DOM ne met à jour que des `transform`, jamais de mise en page, à 30 images par seconde au plus, et rien quand rien ne joue.

**Accessibilité**

- Tous les contrôles du lecteur sont de vrais `<button>` avec un nom accessible. Les presets sont un groupe de bascules en `aria-pressed`. La barre de progression est un `input type="range"` étiqueté.
- Une région `aria-live="polite"` annonce le changement de piste et le nombre de résultats après filtrage. La bande défilante est `aria-hidden`, son contenu est annoncé par cette région.
- Aucun raccourci clavier à une seule touche. Les touches média passent par la Media Session.
- Focus toujours visible, en double anneau (`ink` et `red`) pour rester visible sur tous les fonds.
- Le texte au marqueur a toujours un équivalent en texte normal.
- Mouvement réduit respecté partout (voir §3.6).
- Sur iOS, un arrêt dû au verrouillage est affiché comme une pause, jamais comme une lecture en cours.
- `lang="fr"` ; les textes de sortie en anglais portent `lang="en"`.

**Sans JavaScript**

- Toutes les pages sont rendues côté serveur avec leur contenu complet.
- Les cassettes sont des liens, les presets sont des liens de filtre.
- Le lecteur est remplacé par une barre statique avec des liens Bandcamp « écouter sur Bandcamp ».

**Sans WebGL**

- Le mur est une texture statique AVIF générée, et la transition devient un balayage simple.

**Mobile, conçu à 390 px d'abord**

- Barre du haut : logo et bouton « menu », qui ouvre la barre de menu du skin en plein écran avec de grandes cibles.
- Lecteur en barre basse de 64 px, au-dessus de la zone de sécurité. Le déplier ouvre le skin complet en feuille (presets, transport, volume, progression).
- Le mur en deux colonnes de cassettes, cibles de 44 px au minimum.

---

## 9. Phases de travail

Chaque phase suit la même méthode :

- worktree et branche `experience/groove-to-grave`, preview Vercel, jamais de fusion sans accord ;
- un commit par bloc ;
- `tsc`, lint, build et revue visuelle avant chaque push ;
- comptes rendus courts (fait / arbitrages / résultats / reste) ;
- **planches** de captures légendées à 1440 et 390 px, pleines hauteurs après animations, une image par format, envoyées au directeur artistique pour la passe de direction.

**Phase 0 — Audit.** Faite le 8 octobre 2026. Lire la-coupe (conventions, ticker, transitions, canvas, script d'images, tuile du carrousel et modèle Prisma, en lecture seule). Vérifier `ffmpeg`, Playwright et `sharp`. Proposer les dépendances (aucune attendue) et le plan de fichiers. Rien n'est installé ni écrit avant accord. Arbitrages en tête de document.

**Phase 1 — Contenu et médias.** Aucun code d'interface hormis les types de contenu. Écrire le contenu typé depuis les sources publiques, `sources.md`, `scripts/g2g-fetch-media.ts`, dossiers `media/label/` avec README, manifeste vide et règles `.gitignore`, `scripts/g2g-media.ts` (priorité label / public / provisoire, images, extraits label, `rapport.md`), `scripts/g2g-couleurs.ts`, `scripts/g2g-extraits.ts`, puis **planche « relevé DA »** en une seule image : toutes les pochettes et tous les visuels de soirées récupérés, légendés (référence ou date, source, crédit, dimensions), les deux couleurs extraites en pastilles sous chaque pochette avec leur valeur hexadécimale, et la liste de ce qui manque. Stop : le directeur artistique fait la passe d'identité et les tokens sont mis à jour.

**Phase 2 — Fondations.** Route, layout, tokens, polices, toutes les pages en rendu serveur avec le vrai contenu, parcours complet sans JavaScript, état vide des soirées. Planche.

**Phase 3 — Lecteur et son.** Moteur audio, skin complet, mode mini, barre mobile, bande défilante, spectre, compteurs, presets synchronisés à l'URL, sons d'interface, Media Session, réglages persistés. Planche, plus un enregistrement d'écran de 30 s par format pour le son.

**Phase 4 — Cassettes et mur.** Composant cassette et ses variantes, système de désordre déterministe, insertion FLIP, canvas WebGL du mur, repli statique. Planche.

**Phase 5 — Transitions et pages détail.** Avance rapide, pages sortie, artiste et label, contact et newsletter (sans enregistrement), fin de bande. Planche.

**Phase 6 — Finition et audits.** Passe d'accessibilité (clavier complet, VoiceOver avec le directeur artistique, mouvement réduit), audits de performance séquentiels, corrections, checklist Safari remise au directeur artistique. Tuile dans le carrousel de la home : la ligne Prisma est préparée (`scripts/g2g-upsert-projet.ts`, upsert de la seule entrée `groove-to-grave`). **Bloc 7.1** : accord explicite donné le 11 octobre 2026 pour la fusion sur `main` puis une seule écriture en base, dans cet ordre, avec contrôles avant et après (compte des lignes, aucun autre `updatedAt` modifié, commande de retour arrière).

**Phase 7 — Autonomie éditoriale du label.** Étape 1 : audit comparatif de CMS (Sanity, Keystatic et Keystatic Cloud, Payload, autre) sans installation ni écriture, sur les éditeurs non techniques, les modèles et validations, le pipeline médias, la publication, le coût, la portabilité, la performance et l'effort ; décision du directeur artistique. Étapes suivantes selon la décision.

---

## 10. Definition of done

Cochée le 10 octobre 2026 (Phase 6), une preuve par ligne ; les lignes qui dépendent du directeur artistique ou du label restent ouvertes.

- [x] Toutes les pages du §4, rendues côté serveur, contenu réel avec sources, textes de notre main marqués `draft`. Preuve : 11 pages servies en HTML sans JavaScript (`scripts/g2g-a11y.ts`, contrôle « sans JavaScript » aux deux formats), `content/*.ts` avec `sources` et `verified` par entrée, `draft: true` rendu en « brouillon » (`g2g-brouillon`), page `/sources`.
- [x] Aucune œuvre du label altérée ; chaque pochette et chaque flyer est crédité. Preuve : `scripts/g2g-lib.ts` n'applique que `rotate()` d'orientation EXIF et un redimensionnement proportionnel (revue de code Phase 6) ; légende « Œuvre affichée intacte » et crédit artwork sur chaque pochette, `flyerCredit` sur chaque flyer ; le shader ne reprend aucune forme (`canvas/mur-shader.ts`).
- [x] Lecteur persistant : aucune coupure de lecture sur toutes les navigations internes, y compris retour et avance du navigateur. Preuve : `scripts/g2g-verif.ts`, contrôle « lecture sans coupure : lien, retour, avance du navigateur », position de l'extrait qui avance à chaque étape, aux deux formats.
- [x] Zéro son et zéro `AudioContext` avant un geste ; aucun mouvement continu quand rien ne joue. Preuve : `new AudioContext()` n'existe que dans `Moteur.demarrer()`, appelé par `lire()` depuis un gestionnaire de clic (revue de code Phase 6) ; ticker à l'arrêt sans abonnés, bande, bobines, spectre et mur arrêtés hors lecture (`g2g-verif.ts`, « canvas prêt », `g2g-a11y.ts`, mouvement réduit).
- [x] Presets : filtre, son et URL synchronisés ; fonctionnent sans JavaScript (filtre seul). Preuve : `?genre=` lu par la page serveur et poussé par `SyncPreset`, `router.replace` depuis le lecteur ; sans JavaScript, les cinq filtres sont des liens (`g2g-a11y.ts`, « sans JavaScript »).
- [ ] Lighthouse ≥ 95 sur les quatre axes, desktop et mobile, sur les quatre pages de référence. État : desktop 100 en performance, accessibilité et bonnes pratiques sur les quatre pages ; mobile 91 à 93 en performance (LCP simulé 3,2 à 3,5 s, TBT < 10 ms, CLS 0), 100 ailleurs ; SEO à 63-66 des deux côtés à cause du `noindex` voulu par le §1 (seul audit en échec : `is-crawlable`). Preuve : `scripts/g2g-lighthouse.ts`, rapports hors du dépôt. Depuis le bloc 7.4c, **95 en médiane sur la page sortie est accepté** (§13.5 pour la variance et le modèle de mesure). Décision restante : lever le `noindex` le jour du domaine (SEO 100).
- [x] Parcours complet au clavier, mouvement réduit propre, repli sans WebGL et sans JavaScript vérifiés. Preuve : `scripts/g2g-a11y.ts` (lien d'évitement, ordre skin puis contenu, focus visible, rien sous le skin, menu et feuille sans piège, Échap, aria-live, replis page par page aux deux formats) et axe-core à zéro violation sur 11 pages × 2 formats et les états du lecteur.
- [ ] VoiceOver correct sur le lecteur : à passer par le directeur artistique.
- [ ] Planches finales 1440 et 390 validées par le directeur artistique ; checklist Safari macOS et iPhone passée par lui.
- [x] `tsc`, lint et build propres ; aucune nouvelle dépendance non validée ; aucune écriture en base. Preuve : passés avant chaque push ; `git diff main -- package.json` ne touche que le script `test:g2g-tokens` ; aucun import Prisma sous `groove-to-grave` ; l'entrée de `seed.ts` n'est pas exécutée.
- [x] Crédit « Site réalisé par Julien Robert pour Groove To Grave Records » et droits des œuvres en pied de page (`layout/fin-de-bande.tsx`) ; plus aucune mention « concept non officiel » (bloc 7.0). Les extraits restent provisoires (`origine: 'provisoire'`) tant que le label n'a pas fourni les siens.
- [x] Accord du label : carte blanche donnée le 11 octobre 2026 pour la plateforme officielle et l'usage des assets.
- [ ] Domaine final choisi, `G2G_URL_SITE` posée, `noindex` retiré.

---

## 11. À ne pas faire

- Pas d'autoplay sonore, pas de scroll-jacking, pas de défilement horizontal de page.
- Pas de bouton décoratif : tout ce qui a l'air cliquable l'est.
- Pas de filtre, de distorsion ni de grain **sur** les pochettes et les flyers.
- Pas de walkman ou de lecteur en 3D photoréaliste, pas de chrome en dégradé : l'objet est imprimé à plat.
- Pas de la bande défilante comme seul moyen de navigation ou seule source d'une information.
- Pas de Permanent Marker pour le texte courant, pas de `red` en texte sur fond clair : utiliser `redInk`.
- Pas d'aléa au rendu (rotations), pas de second canvas.
- Pas d'analyse audio des lecteurs intégrés Bandcamp ou SoundCloud, pas d'aspiration d'Instagram.
- Pas de fait inventé (genre, biographie, date, prix) présenté comme vérifié. Pas de prix stockés : le prix est sur Bandcamp.
- Pas de retour au vocabulaire nautique ou radio FM.
- Pas de reprise de la DA de la-coupe.
- Pas de three ni de fiber pour le mur, pas de Playwright pour les extraits.
- Pas de `useSearchParams` dans le lecteur ni dans le layout.
- Pas d'audits en parallèle, pas d'écriture Prisma, pas de fusion sans accord.

---

## 12. Questions ouvertes

1. ~~**Accord du label**~~ Obtenu le 11 octobre 2026 : carte blanche pour la plateforme officielle et les assets. Restent à recevoir les fichiers eux-mêmes (logos, extraits, textes validés).
11. **Domaine final** : la plateforme reste-t-elle sous `/experience/groove-to-grave` dans le portfolio, ou part-elle sur un domaine du label (projet Vercel séparé) ? Le `noindex` et la canonical (`G2G_URL_SITE`) en dépendent ; l'extractibilité est préparée (§6, audit du bloc 7.0).
12. **Autonomie éditoriale** : quel outil pour que le label publie lui-même sorties, soirées et textes ? Tranché en Phase 7 : Sanity en offre Free, Studio hébergé à part, pipeline médias en Action GitHub (§7 et §13.6). Le label publie lui-même depuis la Phase 7.5 ; il reste à envoyer les invitations.
2. **Fichiers de logo** : à obtenir du label pour remplacer les tracés provisoires `PLACEHOLDER-TRACE` (§2.2). Typographies : confirmées en passe d'identité (§3.2).
3. ~~**GTGR01** existe-t-il ?~~ Résolu en Phase 1 : GTGR01 est *Common Speed EP* de LukasDarian, sortie numérique du 22 juillet 2022 (artwork Cbrgraphics, mastering Marine Benabou). GTGR02 reste le premier vinyle.
4. ~~**Crédits de GTGR04**~~ Résolu en Phase 1 : artwork JeunePenard, mastering Benoit D., sortie le 21 mars 2025, vinyle épuisé.
5. **Genres par sortie** pour les presets : validation par le label.
6. **Composition du crew** : Fritzy et Pink Mermaids font-ils encore partie du collectif ?
7. **Date de Danza To The Grave**, et lieu de la soirée du 7 février 2025.
8. **Adresses** de contact et de démos, procédure de démo, fournisseur de newsletter.
9. La métaphore de la cassette plaît-elle au label, qui vend des vinyles ? La réponse proposée : la cassette est l'objet d'écoute, le 12″ reste en avant sur chaque page sortie.
10. **Un indicatif vocal** enregistré par le crew (« Groove To Grave ! ») pour remplacer le « clac » à l'insertion de la première cassette ?

---

## 13. Mémoire technique — règles, mesures et pièges

Consolidé le 13 octobre 2026 (Phase 7.8), en reprenant tout ce qui ne vivait que dans les comptes-rendus de phase avant que ceux-ci ne soient remplacés par `historique.md`. Le détail des exécutions reste dans git.

### 13.1 Chaîne audio

- **La normalisation des presets n'est pas une marge fixe de −6 dB, mais une table mesurée** : `NORMALISATION_DB` compense la sonie réellement ajoutée par chaque courbe (HOUSE −3,6, BREAK −1,5, MINIMAL +3,0, ELECTRO −2,9, TOUT 0), mesurée par ffmpeg sur trois extraits. La consigne nominale « compenser le relèvement maximal » surcorrigeait de 3 à 4 LU : relever les graves de 7 dB n'ajoute que 3,6 LU. À remesurer avec les vrais extraits du label.
- **Le `DynamicsCompressorNode` applique un gain de compensation automatique d'environ 5 dB qu'on ne peut pas désactiver** : un trim de −5 dB le retire après le limiteur, qui reste en bout de chaîne. Sans ce trim la sortie faisait −11 LUFS au lieu de −16.
- **Objectifs mesurés sur la chaîne, volume par défaut 0,85** : sortie à −16 ±1 LUFS (mesuré −16,2 à −16,6), écart entre presets sous 1 LU (mesuré 0,4), crêtes sous −3,8 dBTP, clac à 10 dB au moins sous la musique (mesuré 11,1), avance rapide à 12 dB (mesuré 10,6, la mesure étant dominée par le clac final, accepté), souffle à 21,6 dB sous.
- **`loudnorm` de ffmpeg ne tient pas la cible** et n'est pas utilisé : en linéaire il n'atteint pas −14 LUFS à cause du facteur de crête des boucles, en dynamique il la manque de 3 à 4 LU sur 45 s. `encoderMp3Normalise` mesure et limite de façon itérative (jusqu'à six passes).
- **Le pleurage de démarrage est fait par la vitesse de bande**, `playbackRate` de 0,72 à 1 en 0,5 s avec `preservesPitch` désactivé, et non par un détunage d'oscillateurs : sur un fichier, c'est plus juste.
- **Estimation du BPM** : enveloppe d'attaques à 43 trames par seconde, autocorrélation de 70 à 180 BPM, préférence 100 à 150, **interpolation parabolique du pic obligatoire** — sans elle, le retard entier de trame donne 123 BPM au lieu de 126.

### 13.2 Lecteur

- **Spectre** : 32 bandes réparties en fréquence logarithmique de 40 Hz à 16 kHz, chacune moyennée sur ses cases d'analyseur (`fftSize` 2048), montée franche et descente lissée d'environ 300 ms, segments en `lcdLit`, les deux du haut en `lcdPeak`. Chaque colonne est un fond masqué en segments dont seule la `scaleY` d'un enfant change, pour que les 32 colonnes restent visibles éteintes (6 segments dans 30 px).
- **État d'échec du lecteur** : le moteur arme une veille de **3 secondes** au geste ; si pas une seconde d'extrait n'a été jouée, ou si l'élément audio émet une erreur, ou si `play()` est refusée, l'extrait est déclaré indisponible — l'afficheur écrit « EXTRAIT INDISPONIBLE · BANDCAMP » en rouge d'alerte avec le lien vers la sortie (`role="status"`), le souffle est coupé, le transport revient à l'arrêt et le compteur à zéro.
- **Clone d'insertion** : c'est la tuile entière qui est clonée (mêmes classes, même SVG, même sticker), sans son texte ni son bouton, montée dans la racine `.g2g` pour hériter des variables, marquée `inert`, partant avec la rotation de l'original et atterrissant droite ; l'original reste visible pendant le vol. Les positions sont mesurées après `lenis.stop()`, puis `lenis.start()` à la fin du vol, sinon le FLIP part de coordonnées fausses.

### 13.3 Système de design, dimensions de référence

- **Espacements** : échelle unique `--s1` à `--s7`, de 8 à 144 px, appliquée partout ; intertitres en `g2g-sous-section`.
- **Typographie** : titre de page Archivo condensé 900, capitales, `clamp(64px, 11vw, 168px)`, interligne 0,86, sur une bande de papier avec scotch et rotation déterministe de 1,5° au plus **seulement s'il tient sur une ligne** ; sections `clamp(36px, 5vw, 64px)` ; texte courant 18 px desktop et 16 px mobile, interligne 1,5, mesure de 68 caractères ; métadonnées 13 px.
- **Grille** : 12 colonnes, 1360 px, gouttières 32 px, marges 48 px (16 px sur mobile) ; mur de 4 cassettes à 1440 px, 2 à 390 px. Pages d'artistes : colonne mesurée `--mesure-artiste: 62ch` au-delà de 1100 px, grille des sorties plafonnée à 920 px.
- **Boutons** : rectangles à rayon 3 px, contour `ink` 2 px, aplat `poster`, Archivo 600 ; action principale en aplat `red` ; au survol et à l'appui, décalage de 2 px sur une ombre pleine `ink` de 3 px. Presets et filtres dans le même langage, l'actif en aplat `ink`.
- **Hauteurs du skin** : 132 px sur desktop (bords 6, marges 9, rangée de titre 32, écart 4, rangée 2 de 81) et **155 px sous 1100 px**, où les presets repassent en troisième rangée ; barre mobile du haut 56 px, barre basse 64 px. L'afficheur tient en deux rangées fixes — bande défilante et presets (24 px), spectre et compteurs (30 px) — la progression étant sous l'afficheur (14 px) : trois rangées ne tiennent pas sans couper.
- **`scroll-padding-top` effectif** : 148 px sur desktop, 172 px entre 768 et 1100 px, 72 px (80 px en bas) sur mobile.
- **Bandeau de sortie** : la dominante est rapprochée du texte par pas de 5 % jusqu'à atteindre 4,5:1 ; la pochette reste intacte.
- **Extraction des couleurs de pochette** : les pochettes des vinyles sont des étiquettes rondes sur fond noir, donc la dominante est lue **dans le disque inscrit (rayon 48 %)**, à 4 bits par canal — sans cette règle la dominante était le fond noir pour quatre sorties sur sept. Chaque couleur porte son contraste avec `ink` et avec `poster`.

### 13.4 Mur et canvas

- **Pas de voile au chargement** : `data-pret` est posé après le premier rendu complet du shader, à l'image suivante, puis fondu de 300 ms ; `gl.clearColor` en `wall` et `clear` avant chaque rendu, la texture de repli restant dessous. Contrôlé par la luminance du coin au-dessus du skin à 80, 400 et 1200 ms.
- **Réaction au son** : respiration sur l'énergie des graves de 40 à 160 Hz, tremblement sur les attaques de grosse caisse (montée brusque, décroissance en 250 ms), déplacement de **3 px au plus**.
- **La texture de repli ne tient pas sur iOS** : l'attachement fixe y est ignoré, la texture de 2200 px suit la page et se répète au-delà. Repli assumé ; le canvas prend le relais partout où WebGL2 existe.

### 13.5 Performance

- **Comment Lighthouse estime le LCP** : le modèle Lantern traite chaque nœud du graphe pessimiste comme bloquant et estime le LCP d'un texte comme le temps de téléchargement, à 1,6 Mbit/s, de **toutes** les ressources demandées avant le LCP observé. Le premier rendu réel est à 83 ms (136 ms avec le CPU ralenti ×4) : l'écart avec le LCP simulé n'est pas un défaut de la page, et il faut retirer environ 120 kB du chemin pour gagner 0,4 s.
- **Variance de la mesure** : cinq passages d'une même page vont de 90 à 100 en performance. Un écart de deux ou trois points est dans le bruit — seule la médiane de cinq passages sur la preview compte.
- **JavaScript public** : 204 à 209 kB transférés (gzip) sur 14 fichiers, dont environ 181 kB avant le LCP ; **la part propre à l'expérience est de 19 kB** (lecteur 13, store et moteur 6), le reste étant le socle Next (React DOM 70, routeur 39, client 50). GSAP (27 kB) et le shader (4 kB) arrivent à l'inactivité, et rien de Sanity n'entre dans le bundle.
- **Polices avant le LCP** : 43 kB depuis le bloc 7.4c (Archivo 43, VT323 5 hors chemin critique), contre 48 kB avant.
- **Deux `preconnect` vers le CDN Sanity** : un clair pour les images, un en mode CORS pour l'audio — ce sont deux connexions distinctes pour le navigateur.

### 13.6 Infrastructure Sanity

- **Le projet** : Sanity `da2plce8`, dataset `production`, **privé**, organisation « Julien Robert » (à renommer quand le label aura la sienne) ; Studio déployé sur https://groove-to-grave.sanity.studio, dossier `studio/` avec son propre `package.json`, hors du bundle et des dépendances du portfolio.
- **Piège du dataset privé** : sans jeton, Sanity ne répond pas 401, il **filtre** — la même requête GROQ renvoie 0 document au lieu d'une erreur. Un « 0 résultat » inattendu est d'abord un jeton manquant, jamais un dataset vide.
- **Secrets et emplacements autorisés** : `SANITY_LECTURE_TOKEN` (viewer), `SANITY_SAUVEGARDE_TOKEN` (viewer), `SANITY_PIPELINE_TOKEN` (editor), `SANITY_WEBHOOK_SECRET`, `SANITY_WEBHOOK_MEDIAS_SECRET`, `G2G_GITHUB_TOKEN` (fine-grained, dépôt seul, Contents lecture et écriture). Ils vivent dans `.env.local`, `studio/.env.local`, les variables Vercel et les secrets GitHub — **jamais dans le dépôt, jamais dans la configuration d'un webhook Sanity**.
- **Le plan Free est limité à deux webhooks**, les deux sont pris (revalidation, médias) : pas de webhook d'essai disponible, et le journal des tentatives de Sanity a plusieurs dizaines de secondes de retard.
- **`delta::changedAny` ne livre rien** : trois sélecteurs essayés, aucune livraison, alors qu'un filtre simple se déclenche. Le filtre du webhook médias est donc `_type in ["sortie","soiree","artiste"]` sans delta ; la boucle s'arrête grâce à l'empreinte.
- **Lecture, cache et revalidation** : requêtes GROQ serveur (`defineQuery`, `useCdn: false`) en `cache: 'force-cache'` avec les tags `g2g`, `g2g:<type>` et `g2g:<type>:<clé>` ; route `POST /api/g2g/revalidation` qui vérifie la signature HMAC (401 sinon) puis appelle `revalidateTag`. **Publication visible en production en 7,4 s mesurées, sans rebuild.**
- **Clés stables** : référence de sortie (`slug`), date ISO de soirée, slug d'artiste, `ref-position` pour les pistes ; identifiants de documents sur le même motif (`sortie-gtgr05`, `artiste-kitchen-plug`, `soiree-2026-10-11`).
- **L'adaptateur est la frontière** : `sanity/adaptateur.ts` convertit les documents vers les types de `content/types.ts`, qui reste le modèle de vue des composants. Aucun composant d'affichage ne connaît Sanity.
- **Repli si Sanity est injoignable** : chaque requête renvoie, sur erreur, le résultat correspondant de l'**instantané commité** `sanity/instantane.json`, si bien que le build réussit toujours. **Règle : relancer `g2g-instantane-sanity.ts` avant chaque mise en production tant que le contenu bouge**, sinon le repli est périmé.
- **Aperçu** : `GET /api/g2g/apercu` n'ouvre le mode brouillon que sur un secret à usage unique émis par l'outil Aperçu du Studio et vérifié auprès de Sanity (401 sinon) ; les pages en brouillon ne sont jamais mises en cache. Pas de surcouche d'édition visuelle : `VisualEditing` tirerait `styled-components` dans le portfolio.
- **Sauvegarde** : Action `g2g-sauvegarde-sanity.yml`, chaque lundi 4 h 30 UTC et à la demande, `sanity dataset export` en artefact gardé 28 jours.
- **Vision n'est chargé que si `NODE_ENV !== 'production'`** : le Studio déployé n'expose que les sections éditoriales.
- **Validations de schéma qui portent les règles du brief** : `imageCreditee` exige **alt et crédit**, le crédit n'étant levé que par la case « auteur non identifié » ; l'extrait brut est refusé si la date de sortie n'est pas passée ; un seul extrait par piste ; `textes` et `reglages` sont des documents uniques ; le lieu d'une soirée est facultatif.
- **Éditeurs** : rôle **`editor`** (`npx sanity users invite adresse --role editor`). Le plan Free compte 20 sièges, dont trois pris par des jetons de robot.

### 13.7 Pipeline médias

- **Latence de référence, en deux parties** : ce qui dépend de nous — dépôt, webhook (1,3 à 1,8 s), relais `repository_dispatch` (5 s), file d'attente, traitement — tient en **52 s** ; la propagation de la page revalidée jusqu'à la périphérie a été mesurée une fois à 3,6 s et une fois à une centaine de secondes, sans explication établie. **Ne pas annoncer « quelques secondes » : le chiffre honnête est « une à deux minutes ».**
- **L'Action est passée de 97 s à 41 s** : checkout partiel (`scripts`, `package.json`, `package-lock.json`, `tsconfig.json`, `.npmrc`), binaire ffmpeg statique repris du cache (0 s au lieu de 30 s d'`apt-get`), `npm ci --prefer-offline --no-audit --no-fund`. Première exécution après invalidation du cache : 44 s ; le cache est posé par branche.
- **Étape « quelque chose à traiter ? » avant tout checkout** : une requête GROQ unique compte les documents dont le fichier d'origine n'a pas l'empreinte du dernier traitement, plus les extraits refusés dont la sortie est désormais parue ; si le compte est 0, tout est sauté (8 s au lieu de 70). **Une erreur de lecture compte pour 1** — on ne saute jamais le pipeline sur un incident réseau.
- **Le pipeline patche aussi le brouillon du document s'il en existe un**, pour que la publication suivante ne perde pas les champs calculés.
- **Les dérivés sont produits par nous et stockés comme fichiers Sanity**, pas obtenus par transformation à la volée du CDN d'images : cela garde « jamais recadré, AVIF et WebP sous 300 kB » sous notre contrôle.
- **Pièges du runner** : ffmpeg n'est plus préinstallé sur `ubuntu-latest` ; `ffmpeg -version | head -1` masque le code de sortie d'un tube ; les assets « latest » de FFmpeg-Builds répondent 404 pendant leur réécriture (quatre reprises puis repli `apt-get`) ; un checkout partiel doit inclure `.npmrc` (`legacy-peer-deps=true`), sans quoi `npm ci` échoue sur les pairs de `react-simple-maps`.
- **`repository_dispatch` exécute toujours le workflow de la branche par défaut** : un workflow modifié sur une branche ne peut pas être mesuré de bout en bout avant fusion, il faut passer par `workflow_dispatch`.
- **Le groupe de concurrence annule les exécutions en attente au profit de la dernière** : les « cancelled » de l'historique sont normaux.

### 13.8 Exploitation : Vercel, GitHub, git

- **Une variable d'environnement ajoutée dans Vercel n'est pas lue par un déploiement déjà en ligne** : il faut redéployer.
- **Un déploiement Vercel peut échouer sans build** (`git_info_fail`) ; `vercel inspect --logs` ne dit rien, c'est `errorCode` sur l'API qui le donne, et relancer le même commit suffit.
- **Vérifier ce que sert la production par marqueurs, jamais par l'historique git** : présence d'une route, d'un en-tête `Link`, d'une chaîne du bundle.
- **La home du portfolio est prérendue au build** : toute modification de la table `Project` n'apparaît qu'après un redéploiement ou une revalidation.
- **Le checkout principal doit être mis à jour à la main** (`git pull --ff-only`) après chaque fusion faite par l'API GitHub.
- **Le worktree n'a pas de `.env`** : `npm run build` y échoue sur la home du portfolio (Prisma `ECONNREFUSED`) tant qu'un lien symbolique vers le `.env` du dépôt principal n'existe pas.
- **Le `tsconfig` racine doit exclure `studio/`**, sinon le type-check du portfolio lit le Studio et les previews échouent.
- **En local, l'aperçu et les webhooks pointent la production** : `/api/g2g/apercu/fin` redirige vers l'origine canonique, le webhook Sanity ne vise que la production, et sous `next start` une publication n'est jamais visible (cache par tags).

### 13.9 Limites de l'outillage et pièges de mesure

- **Chrome refuse une fenêtre de moins de 500 px** : les captures à 390 px passent par une émulation d'appareil via le protocole DevTools (`scripts/g2g-devtools.ts`), jamais par un redimensionnement de fenêtre.
- **Chrome headless suspend `requestAnimationFrame` par à-coups sur un onglet inactif** : les 450 ms du vol et les 400 ms de la transition n'y sont pas mesurables image par image. Les contrôles structurels se font dans la tâche même du clic, ou sur une transition figée par `window.__g2g.figerTransition(p)`.
- **Chrome headless n'a pas de WebGL2 sans GPU** : le pilote passe par SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`). **Mais pas pour Lighthouse** : avec SwiftShader, la compilation du shader comptait 900 ms de tâche longue, alors que le GPU de la machine rend le mur comme un appareil réel.
- **Réserve honnête sur l'autoplay** : Chrome headless est lancé avec `--autoplay-policy=no-user-gesture-required`. Les contrôles prouvent que l'`AudioContext` n'est créé et démarré que par le clic, **pas** que la politique d'autoplay d'un navigateur ordinaire est satisfaite.
- **Chrome headless n'a pas de sortie audio** : le son des vidéos est capturé dans la page par `MediaRecorder` sur un `MediaStreamDestination` branché après le gain général, puis muxé avec le screencast.
- **Lire les captures pleine page avec la bonne grille** : la hauteur de fenêtre y vaut celle du document, donc le pied de page est « à l'écran », l'afficheur indique FIN DE BANDE, et les lambeaux du mur sont plus hauts que sur un écran réel. C'est attendu.
- **Playwright WebKit ne démarre pas de page sur cette machine** et `safaridriver` exige « Autoriser l'automatisation à distance » cochée à la main ; `diagnostic.html` sur l'appareil est notre WebKit.
- **Méthode pour un nouveau détecteur** : le passer d'abord sur l'**ancien** état et vérifier qu'il échoue là où il devait échouer, avant de corriger.

### 13.10 Couverture des contrôles

- **Nombres de contrôles au 13 octobre 2026** : `g2g-verif` **226** (86 en Phase 5 → 120 → 154 avec les quatre chemins d'arrivée → 156 → 160 avec l'extrait indisponible → 182 avec les creux → 204 avec le registre → 226 avec le papier d'affiche), `g2g-a11y` **42**, `tokens.test.ts` **19 paires + 19 affiches**. **Toute baisse de ces nombres est une régression de couverture, pas une simplification.**
- **`g2g-verif` parcourt onze pages aux deux formats** : `/`, `/sorties`, `/sorties/gtgr05`, `/sorties/gtgrva02`, `/artistes`, `/artistes/kitchen-plug`, `/artistes/lungo`, `/soirees`, `/label`, `/contact`, `/sources`. Tolérance zéro sur les erreurs : exceptions, `console.error`, requêtes en échec et entrées navigateur, seuls les avertissements du pilote SwiftShader étant ignorés.
- **Planches** : planche pleine hauteur d'une image par format, et dossiers par page coupés à deux hauteurs d'écran, JPEG 82 ; `--pages`, `--vignette` et `--fenetre` pour les planches-contact. Depuis 7.8 tout s'écrit **hors du dépôt** (`~/Desktop/g2g-sorties`, `G2G_SORTIES`).

### 13.11 Contenu et règles éditoriales

- **Le vocabulaire nautique des textes de soirées est celui du label, pas le nôtre** : les textes repris sont cités à leur premier paragraphe, en langue d'origine. L'interdiction du §11 porte sur notre écriture, pas sur une citation du label.
- **Choix de l'œuvre illustrant une page d'artiste** : la sortie solo la plus récente, à défaut la compilation la plus récente où l'artiste signe une piste.
- **Sorties voisines sur une page sortie** : la précédente et la suivante dans la série GTGR, plus une compilation.
- **Les soirées sont classées par la seule logique de date** : page soirées régénérée chaque heure (`revalidate = 3600`), accueil dynamique, archive le lendemain sans changement de contenu. Un changement de planche imputé aux médias est souvent ce basculement.
- **`alt` du label prioritaire** : dans `Photo`, le texte alternatif saisi dans le Studio l'emporte sur celui construit par la page.
- **Volumes du registre** : 7 sorties et 37 pistes, 19 artistes, 17 soirées, plus textes et réglages ; chronologie à 24 lignes (17 soirées, 7 sorties) ; 279 documents publiés et 6 brouillons au 13 octobre 2026. `sanity documents validate` doit rendre **45 documents valides, 0 erreur, 0 avertissement**.

### 13.12 Autonomie du label

- **Deux documents vivants** : `docs/groove-to-grave/guide-label.md` et `docs/groove-to-grave/a-completer-par-le-label.md`. **Le Studio lit le guide tel quel depuis le dépôt (`?raw`)** : il n'en existe qu'une version, corriger le fichier met le Studio à jour au prochain déploiement.
- **Règle de réversibilité, à dire aux deux endroits où elle compte** : tout ce qui est **écrit** se récupère depuis l'historique du document, mais un **fichier remplacé** — pochette, flyer, extrait — ne revient pas.
- **Images à déposer** : le fichier d'origine le plus grand disponible, **au moins 1600 px**, jamais recadré ni retouché.
- **Délais annoncés au label** : un texte publié apparaît le plus souvent en moins d'une minute, parfois deux ou trois ; un extrait demande une à deux minutes de plus ; attendre dix minutes avant de s'inquiéter.

## Annexe — écarts connus entre la maquette et ce brief

La maquette `prototype-lecteur.html` montre les mécaniques. Le brief fait foi partout où ils diffèrent :

- La maquette fait défiler la bande et anime le spectre même à l'arrêt ; le brief les arrête quand rien ne joue.
- Dans la maquette, cliquer la cassette lance la lecture ; dans le brief, la cassette est un lien, et un bouton séparé lance la lecture.
- La maquette n'a pas de fenêtre cassette dans le skin, ni d'insertion animée.
- La maquette utilise la durée d'UFO Catcher pour toutes les sorties ; le brief utilise la vraie durée de chaque extrait.
- Dans la maquette, la barre de progression n'est pas cliquable ; dans le brief, c'est un `input type="range"`.
- La maquette dessine le spectre dans un canvas 2D ; le brief le fait en DOM.
- La maquette a un mur plat et des polices placeholder différentes (Anton) ; le brief prévoit le mur en WebGL et Archivo.
- La maquette utilise le libellé « démos » ; le brief a une page contact et la démo dans la page label.
- La maquette synthétise la musique en direct ; le brief lit des fichiers d'extrait via `HTMLAudioElement`.
