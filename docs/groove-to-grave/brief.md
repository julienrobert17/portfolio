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
6. §9 : tuile du carrousel (`scripts/generate-g2g-tuile.ts`), accent `#F14442` dans `accents.ts`, entrée Prisma préparée dans `seed.ts` et non exécutée.

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
2. `sharp` reste une dépendance transitive de Next, comme dans la-coupe. Aucune nouvelle dépendance (§6).
3. Extraits provisoires synthétisés en TypeScript pur hors navigateur, WAV puis MP3 par `ffmpeg` ; plus de Playwright (§6).
4. `ticker.ts`, `gsap.ts`, `lenis-store.ts` et `use-page-settled.ts` dupliqués depuis la-coupe dans `groove-to-grave/lib/` avec un commentaire d'origine ; le repli de navigation sans navigateur enregistré passe par `router.push`, jamais `window.location.assign` (§6).
5. Mur WebGL en WebGL2 brut (un canvas, un quad, un fragment shader), sans three ni fiber : seul écart volontaire aux conventions de la-coupe, pour le poids (§5.5, §6).
6. Chaîne audio : marge de −6 dB dans la normalisation des presets et un `DynamicsCompressorNode` en limiteur avant le gain général (§3.7, §5.3).
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
  - **soirée**, avec date dans la bande, lieu et horaires sur l'étiquette, sans bouton écouter ;
  - **vierge**, pour la page contact (« envoie ta tape »).

### 3.5 Le lecteur (skin)

- Skin **dessiné comme les étiquettes du label** : contour `ink` de 2 à 3 px et aplats `chrome`, `red` et `green`, sans biseau gris, sans dégradé ni ombre portée, sans rendu photoréaliste. Deux ou trois stickers et une signature au marqueur collés dessus.
- **Barre de titre** : le monogramme G2G et un bouton fonctionnel de passage en mode mini.
- **Barre de menu** : la navigation principale (voir §4).
- **Afficheur** :
  - la bande défilante en VT323 ;
  - le spectre en segments, 32 colonnes de 9 segments, en DOM (colonnes `scaleY` avec masque à segments), pas de second canvas, mis à jour à 30 images par seconde au plus et arrêté quand rien ne joue ;
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

`content/groove-to-grave/` à la racine du repo ne contient pas de code : `sources.md` (sources et ce qui reste à vérifier), `media/source/` et `sources.json` (originaux publics récupérés par script), `media/label/` (fichiers fournis par le label, voir §7) et `media/rapport.md`.

**Extraits.** Chaque piste porte un extrait optionnel (`excerpt?: { src, duration, provisional }`). Les extraits provisoires synthétisés ne sont attribués qu'à la piste A1 de chaque sortie ; les autres pistes n'affichent pas de bouton écouter tant qu'aucun vrai extrait n'existe.

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
| 7 février 2025 | Lieu à vérifier | Emi Ömar b2b Gregs, Alyhas, Pink Mermaids |
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

   La normalisation de gain évite qu'un preset paraisse « mieux » parce que plus fort, avec une marge de −6 dB ; un `DynamicsCompressorNode` réglé en limiteur, juste avant le gain général, rattrape les crêtes du preset HOUSE.
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
  - Un seul `HTMLAudioElement` persistant, créé par un singleton de module hors React (le `MediaElementAudioSourceNode` ne se crée qu'une fois par élément), branché sur la chaîne d'égalisation (graves, médiums, aigus, passe-haut), un gain de normalisation avec marge de −6 dB, l'analyseur, un `DynamicsCompressorNode` en limiteur, le gain général, la sortie.
  - Les sons d'interface passent par un gain séparé.
  - Les extraits sont **hébergés localement**, en même origine, ce qui est la seule façon de les analyser ; les lecteurs Bandcamp et SoundCloud intégrés ne sont pas analysables. Format MP3 192 kbps, `preload="none"`.
- **État du lecteur** : stores de module et `useSyncExternalStore`, le motif déjà en place dans la-coupe (`hero-store.ts`, `navigation-store.ts`, `use-reduced-motion.ts`). Pas de contexte React, pas de dépendance. Les search params ne sont lus que par les pages serveur (§4).
- **Couleurs des cassettes** : extraites par script avec `sharp` (`stats().dominant`, plus une couleur d'accent calculée), écrites dans le contenu typé et vérifiées pour le contraste avec `ink`. `sharp` reste une dépendance transitive de Next, utilisée comme dans `fetch-la-coupe-photos.ts`.
- **Extraits provisoires** : synthèse en TypeScript pur hors navigateur dans `scripts/g2g-extraits.ts`, qui rejoue les recettes de la maquette (grosse caisse, charley, basse, souffle, égalisation) échantillon par échantillon, une boucle distincte par sortie (BPM, motif de grosse caisse, ligne de basse), de 45 s, avec fondus, écrite en WAV puis encodée en MP3 192 kbps par `ffmpeg`. Pas de Playwright. **Aucune question de droits.** Les vrais extraits n'entrent qu'avec l'accord du label (§7).
- **Médias réels** : `scripts/g2g-fetch-media.ts` récupère les pochettes publiques (Bandcamp) et les visuels d'événements publics (Shotgun, RA) vers `content/groove-to-grave/media/source/`, avec un `sources.json` qui donne l'URL d'origine, la date et les dimensions. Ce qui échoue est listé pour capture manuelle. Instagram n'est **jamais** aspiré par script. `scripts/g2g-media.ts` résout chaque emplacement selon la priorité du §7 et écrit `content/groove-to-grave/media/rapport.md`.
- Aucune nouvelle dépendance. Décision de Phase 0 : il n'en faut aucune.
- **Autonomie et extractibilité** (audit du bloc 7.0, sans rien couper) : tout ce qui est propre à G2G vit dans `src/components/experience/groove-to-grave/` (composants, contenu, styles, polices, tokens), `src/app/experience/groove-to-grave/` (route), `scripts/g2g-*.ts` et `generate-g2g-tuile.ts`, `public/experience/groove-to-grave/`, `content/groove-to-grave/` et `docs/groove-to-grave/`. Attaches au reste du portfolio, à couper le jour d'une application Next indépendante : le hook `@/lib/use-reduced-motion` (3 imports, à copier dans `lib/`) ; le layout racine du portfolio (`src/app/layout.tsx` : `<html lang>`, `globals.css`, polices Geist, curseur, en-tête et pied conditionnels masqués par `IMMERSIVE_PREFIXES` de `src/lib/routes.ts`) à remplacer par un layout racine propre ; le préfixe `BASE` de `lib/routes.ts` et les chemins publics en dur (`content/extraits.ts` généré, `ui/photo.tsx`, `styles/g2g.css`, `store/lecteur-store.ts` pour la Media Session, les scripts) à ramener à la racine ; les chemins relatifs de `next/font/local` dans le layout ; les dépendances à déclarer dans un `package.json` propre (`gsap`, `lenis`, `sharp`, `tsx`, config ESLint et `tsconfig` avec l'alias `@/*`) ; le script `test:g2g-tokens` ; la variable `G2G_URL_SITE`. Restent côté portfolio seulement : l'entrée `accents.ts`, l'entrée de `seed.ts`, `scripts/g2g-upsert-projet.ts` et la tuile. Aucune dépendance à Prisma ni à la base.

---

## 7. Médias fournis par le label

Le site est conçu pour recevoir, sans changement de code, les fichiers que Groove To Grave Records voudra bien fournir.

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
- Le WebGL s'initialise après le LCP, pendant un temps libre du navigateur, et le shader se compile en parallèle sans bloquer le fil principal. DPR plafonné à 1,5 (1 sur mobile), pause quand l'onglet est caché.
- Aucun extrait audio chargé avant un geste. Trois fichiers de police au maximum, seul Archivo est préchargé.
- Audits : `scripts/g2g-lighthouse.ts` (build de production local, `npx lighthouse`, mobile puis desktop, trois passages par page, médiane, rapports HTML dans `docs/groove-to-grave/lighthouse/`), `scripts/g2g-a11y.ts` (axe-core, clavier, aria-live, replis) et `scripts/g2g-verif.ts` (mise en page, lecture continue, exécution réelle du lecteur par quatre chemins d'arrivée, erreurs de console) ; `scripts/g2g-capture-entree.ts` capture en production l'arrivée par la tuile et la lecture.
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
- [ ] Lighthouse ≥ 95 sur les quatre axes, desktop et mobile, sur les quatre pages de référence. État : desktop 100 en performance, accessibilité et bonnes pratiques sur les quatre pages ; mobile 91 à 93 en performance (LCP simulé 3,2 à 3,5 s, TBT < 10 ms, CLS 0), 100 ailleurs ; SEO à 63-66 des deux côtés à cause du `noindex` voulu par le §1 (seul audit en échec : `is-crawlable`). Preuve : `docs/groove-to-grave/lighthouse/phase-6/*.html`, `scripts/g2g-lighthouse.ts`. Décisions à prendre : lever le `noindex` (SEO 100) ; stratégie de polices pour le LCP mobile (compte-rendu de Phase 6).
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
12. **Autonomie éditoriale** : quel outil pour que le label publie lui-même sorties, soirées et textes ? Audit fait en Phase 7, étape 1 (`comptes-rendus/phase-7-audit.md`) : recommandation Sanity en offre Free avec Studio hébergé à part et pipeline médias en Action GitHub ; décision attendue.
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
