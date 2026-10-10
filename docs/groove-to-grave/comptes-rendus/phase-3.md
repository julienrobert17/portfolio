# Groove To Grave — compte-rendu de Phase 3 (lecteur et son), avec le bloc 2.1

10 octobre 2026 · branche `experience/groove-to-grave` · worktree `.claude/worktrees/groove-to-grave`

## Fait

### Bloc 2.1, passe de direction sur la Phase 2 (`7967c1e`, `31ccf95`)

- Crâne : point noir de l'axe restauré (seuil d'éclats abaissé à 0,04 % de la silhouette et `turdsize` à 3 pour cette marque), filtrage des rochers et de l'étoile conservé. Planche logos régénérée.
- Artistes : les affiches à fond ink perdaient leur texte contre `.g2g a { color: inherit }` par spécificité ; texte en poster sur ink, les quatre variantes couvertes par `tokens.test.ts` (ink sur poster, ink sur red, ink sur green à 3:1 pour le grand texte, poster sur ink).
- Page sortie : sticker « no repress » ou « épuisé » dans le bandeau de tête, jamais sur la pochette. Échelle d'espacements `--s1` à `--s7` (8 à 144 px) appliquée partout, intertitres en `g2g-sous-section`. Sorties voisines : précédente et suivante dans la série GTGR, plus une compilation.
- Soirées : la soirée à venir en héros avec son flyer en grand (Finesse Rekords, 11 octobre 2026), date, lieu, line-up et billetterie à côté. Soirée sans visuel : affiche typographique, date en très grand, lieu dessous, mention « visuel non retrouvé » ; plus de titre fabriqué à partir du lieu (`nomSoiree`).
- Échelle typographique : titre de page Archivo condensé 900, capitales, `clamp(64px, 11vw, 168px)`, interligne 0,86, sur une bande de papier (poster, red ou green) avec scotch, rotation déterministe de 1,5° au plus seulement s'il tient sur une ligne (`ui/titre-page.tsx`) ; sections en `clamp(36px, 5vw, 64px)` ; texte à 18 px sur desktop et 16 px sur mobile, interligne 1,5, 68 caractères ; métadonnées à 13 px.
- Boutons : rectangles à rayon 3 px, contour ink 2 px, aplat poster, Archivo 600 ; action principale en aplat red ; décalage de 2 px sur une ombre pleine ink de 3 px au survol et à l'appui. Presets et filtres dans le même langage, l'actif en aplat ink.
- Mise en page : 12 colonnes, 1360 px, gouttières 32 px, marges 48 px (16 px sur mobile), mur de 4 cassettes à 1440 et 2 à 390.
- Fin de bande : crâne de 200 à 260 px (140 px sur mobile), « FIN DE BANDE » à l'échelle des titres de page, texte à 16 px, lien « Sources et crédits » vers la nouvelle page `/sources` (liste groupée Bandcamp, disquaires, billetteries et annonces, archives, titre lisible et domaine). Nuage de sources retiré de la page label.
- Mobile sans JavaScript : sous 768 px, le skin se réduit à la barre de titre et à la navigation.
- `ticker.ts`, `gsap.ts`, `lenis-store.ts`, `use-page-settled.ts` et `smooth-scroll.tsx` dupliqués depuis la-coupe avec un commentaire d'origine.

### Phase 3, lecteur et son

- **Moteur audio** (`audio/moteur.ts`) : singleton de module, rien avant le premier geste ; ce geste crée l'`AudioContext`, le reprend et lance la lecture de façon synchrone. Chaîne : élément → lowshelf 110 Hz → peaking 1,2 kHz → highshelf 6 kHz → passe-haut → normalisation (marge −6 dB) → analyseur → `DynamicsCompressorNode` en limiteur → gain général. Sons d'interface et souffle (−34 dB, seulement en lecture) sur leurs gains séparés. Pleurage de démarrage par `playbackRate` de 0,72 à 1 en 0,5 s, `preservesPitch` désactivé. Réglages persistés en `localStorage` sous try/catch (volume, coupure générale, coupure des sons d'interface).
- **Sons d'interface** (`audio/sons-interface.ts`) : clac (−14 dB), avance rapide à chaque changement de page avec la musique abaissée à 25 % puis remontée, jamais coupée (−16 dB), rembobinage sur le bouton de fin de bande (−16 dB). Pas de son au survol ni sur les presets.
- **Presets** (`audio/presets.ts`) : courbes du brief, normalisation calculée sur le plus fort relèvement ; un seul état partagé par le lecteur et la page sorties (`store`, `SyncPreset` côté page, `router.replace` quand on est sur `/sorties`), compteur SORTIES recalculé.
- **Store** (`store/lecteur-store.ts`) : module et `useSyncExternalStore`, statut vide / lecture / pause / arrêt, piste, position, preset, volume, mini, feuille, menu, annonce `aria-live`. Suivant et précédent dans le filtre courant, fin d'extrait qui enchaîne la piste suivante.
- **Media Session** : titre, artiste, album, pochette WebP 320 px, actions lecture, pause, précédent, suivant, stop.
- **iOS et interruptions** : `visibilitychange` vers caché pendant la lecture → pause honnête ; `statechange` du contexte hors `running` → pause ; une pause venue d'ailleurs (Media Session, système) remonte dans l'état. Reprise toujours au geste suivant.
- **Skin desktop** (`layout/lecteur.tsx`) : collant en haut, 112 px au plus, rangée 1 (monogramme et nom, navigation, mention concept, bouton mini) et rangée 2 (transport précédent, lecture et pause en gros, suivant, stop ; fenêtre cassette 96 × 56 px avec bobines au BPM ; afficheur avec bande défilante, spectre 32 colonnes de 9 segments en DOM à 30 images par seconde au plus, compteurs SORTIES, PISTE, TEMPS avec durée réelle, barre de progression en `input type="range"` ; presets ; volume). Mode mini : rangée 1 et une ligne fine (fenêtre, bande, lecture).
- **Mobile** : barre du haut de 56 px (monogramme, bouton menu qui ouvre la navigation en plein écran, `main` inerte), barre de lecture en bas de 64 px au-dessus de la zone de sécurité (fenêtre, bande, lecture, déplier), feuille avec afficheur, presets, transport, volume et progression.
- **Cassettes** : bouton rond « écouter », seconde cible distincte du lien, seulement si JavaScript est actif (classes `g2g-js`, attribut `data-js` posé par un script en ligne avant le premier paint) et si un extrait existe ; bobines qui tournent à la vitesse du BPM quand la sortie joue. Bouton par piste sur la page sortie, seulement là où un extrait existe.
- **Bande défilante** : vitesse proportionnelle au BPM, arrêtée hors lecture, en pause au survol et au focus, `aria-hidden`, annoncée par la région `aria-live` ; en mouvement réduit, statique et tronquée avec le texte complet en `title`. Rien ne bouge en continu avant un geste ou à l'arrêt.
- **Sans JavaScript** : barre de titre, navigation et lien « Écouter sur Bandcamp » ; le reste du lecteur n'existe pas dans le rendu.
- **Planches et vidéos** : `phase-3-1440-2026-10-10.jpg` (états du lecteur à la fenêtre : arrêt, lecture, preset HOUSE, lecture par piste, mode mini, puis les dix pages en pleine hauteur) et `phase-3-390-2026-10-10.jpg` (mêmes états plus feuille dépliée et menu ouvert). `phase-3-1440-2026-10-10.mp4` et `phase-3-390-2026-10-10.mp4`, 30 s avec le son : `scripts/g2g-video.ts` pilote Chrome par le protocole DevTools, gestes par événements de pointeur, images par screencast, son capturé dans la page par `MediaRecorder` sur le flux de la sortie générale du moteur, assemblage ffmpeg.
- `tsc`, lint, build et test des tokens propres avant chaque push.

## Arbitrages

- **Son des vidéos** : Chrome headless n'a pas de sortie audio et la machine n'a pas de périphérique de capture système (rien d'autre que potrace n'était autorisé à l'installation). Le son des vidéos est donc celui que le moteur produit réellement pendant l'enregistrement, capturé dans la page par `MediaRecorder` sur un `MediaStreamDestination` branché après le gain général, puis muxé avec le screencast. C'est le vrai mixage (extrait, égalisation, clac, avance rapide), pas une reconstitution.
- **Gestes de capture** : clics par `Input.dispatchMouseEvent`, qui comptent comme des gestes utilisateur, plus `--autoplay-policy=no-user-gesture-required` en ceinture ; le moteur reste conforme au brief dans un vrai navigateur.
- **Preset depuis le lecteur hors `/sorties`** : change l'égalisation et le compteur, sans naviguer ; sur `/sorties`, l'URL suit par `router.replace` et la page serveur refiltre le mur.
- **Pleurage** : la maquette détunait des oscillateurs ; sur un fichier, la vitesse de bande fait la même chose, plus juste.
- **Afficheur desktop** : pour tenir en 112 px, rangée 1 à 36 px, rangée 2 à 56 px ; bande à 17 px, compteurs à 15 px, spectre de 20 px.
- **Menu mobile** : un seul composant de navigation rendu deux fois (barre et plein écran) pour garder `aria-current` partout ; le plein écran rend `main` inerte et bloque le défilement.
- **Bouton rembobiner** : reste une ancre `#haut` sans JavaScript ; avec, son de rembobinage et défilement par Lenis.
- **Spectre en mouvement réduit** : maintenu, car il ne bouge que pendant la lecture déclenchée par l'utilisateur ; bobines et bande sont figées comme le brief le demande.

## Résultats

- Build : 11 routes de l'expérience (les 10 pages et `/sources`), 200 partout.
- Vidéos : 1440 × 900 et 390 × 844, 30 s, H.264 et AAC 160 kbit/s ; niveau de crête −9 dB (desktop) et −6 dB (mobile), moyenne −33 et −29 dB.
- Planches : 15 captures à 1440 (5 états, 10 pages), 16 captures à 390 (6 états, 10 pages).
- Tokens : 14 paires vérifiées, inchangées.

## Reste

- Passe de direction du directeur artistique sur les planches 2.1, logos, Phase 3 et les deux vidéos, puis Phase 4 (cassettes et mur WebGL, insertion FLIP, désordre).
- Insertion FLIP de la cassette vers la fenêtre, transition « avance rapide » visuelle et « FIN DE BANDE » dans l'afficheur : Phases 4 et 5.
- Les sons d'interface sont réglés d'après la maquette, pas encore à l'oreille sur de vrais haut-parleurs ; iOS et Safari n'ont pas été observés sur cette machine.
- Vidéo mobile enregistrée à l'échelle 1 (390 px de large) par le screencast ; à réenregistrer à l'échelle 2 si la lisibilité ne suffit pas.
- Fichiers de logo du label, quatre soirées non vérifiées, genres et textes `draft` à valider.
