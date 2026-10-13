# Groove To Grave — historique des phases

> Fil de travail, pour savoir quoi chercher dans git. Les règles, seuils et arbitrages toujours en vigueur sont dans `brief.md` ; cet historique ne dit que ce qui s'est passé, quand, et ce que ça a coûté. Les comptes-rendus détaillés de chaque phase ont été supprimés le 13 octobre 2026 (Phase 7.8) ; leur contenu utile a été versé au brief, le détail reste dans git.

### Phase 1 — Contenu et médias — 10 octobre 2026
`5018a00` (brief v1.1), puis huit commits par bloc

Le contenu typé est écrit depuis les seules sources publiques : sept sorties et trente-sept pistes, dix-neuf artistes, dix-sept soirées, chaque entrée portant ses sources et son drapeau de vérification, tout texte de notre main marqué brouillon. Les scripts de récupération des médias, d'extraction des couleurs et de synthèse des extraits provisoires sont posés, et la planche « relevé DA » sert de base à la passe d'identité. Prouvé par le rapport par emplacement média : zéro fichier du label, vingt publics, sept provisoires, trente absents. Coût : Shotgun bloque les robots et Resident Advisor le HTML, donc les flyers viennent d'archives et d'une API ; quatre soirées restent non vérifiées, les genres des presets sont déduits, et les originaux publics vivent hors du dépôt.

### Phase 2 — Identité et fondations — 10 octobre 2026
`943ac67` (brief v1.2), `ccf1997` (tokens), `904c01e` et `40f9f3e` (contenu), `5712316` (logos), `bd094d2` (fondations), `3f3ab69` (planches)

La passe d'identité entre dans le brief et dans le code : palette relevée sur les pochettes, quatorze paires texte/fond vérifiées au token près, logos provisoires vectorisés fidèlement et marqués comme tels. La route, le layout et huit pages sont rendus côté serveur avec le vrai contenu, le parcours complet fonctionne sans JavaScript et un seul composant est client. Prouvé par un build de neuf routes toutes en 200 et par les premières planches aux deux formats. Coût accepté : menu mobile reporté, compteur du skin affichant le total faute de lire les paramètres d'URL, feuille de style unique plutôt que modules CSS, aucun audit de performance.

### Phase 3 — Lecteur et son, avec le bloc 2.1 — 10 octobre 2026
`7967c1e` et `31ccf95` (bloc 2.1), `e17613e` (lecteur et son)

Le bloc 2.1 applique la direction : échelles d'espacement et de typographie uniques, grille de douze colonnes, page des sources, affiche typographique pour les soirées sans visuel. La Phase 3 fait du lecteur le site : moteur audio en singleton de module qui ne crée rien avant le premier geste, chaîne d'égalisation complète, presets partagés, store de module et Media Session, skin desktop, mode mini et barre mobile, spectre en DOM et bande défilante au tempo. Prouvé par onze routes servies et deux vidéos de trente secondes dont le son est le vrai mixage du moteur. Coût : les sons sont réglés d'après la maquette et non à l'oreille, ni Safari ni iOS ne sont observés, et c'est ici que naît le script en ligne dont le défaut ne sera trouvé qu'au bloc 7.3b.

### Phase 4 — Cassettes et mur, avec le bloc 3.1 — 10 octobre 2026
`895e94e` et `ea8f69c` (bloc 3.1), `834f57a` et `036f9ed` (cassettes et mur)

Le bloc 3.1 reprend les niveaux de fond en comble : normalisation des presets mesurée plutôt que nominale, trim pour annuler le gain automatique du limiteur, spectre en fréquence logarithmique, afficheur réorganisé. La Phase 4 ajoute le mur en WebGL2 brut avec son repli statique, l'insertion en vol de la cassette et le désordre déterministe. Prouvé par les mesures sur captures réelles : sortie à −16,4 LUFS, quatre dixièmes de LU entre presets, crêtes sous −3,8 dBTP, clac à onze décibels sous la musique. Coût : la cible de −14 LUFS reste hors de portée des boucles provisoires, le skin passe de 112 à 120 px, les chevauchements entre cartes sont renvoyés à l'arbitrage, et toutes les mesures sont faites en headless.

### Phase 5 — Transitions et pages détail, avec le bloc 4.1 — 10 octobre 2026
`eda79e1` et `a86efca` (bloc 4.1), `fac7a62` et `989f215` (transitions et pages détail)

Le bloc 4.1 trouve la cause de l'empilement cassé — une règle tardive écrasait le niveau du skin — et la remplace par une échelle unique en variables ; le canvas cesse de voiler la page, le clone d'insertion devient la tuile entière, les lambeaux deviennent du papier déchiré. La Phase 5 livre l'avance rapide visuelle, la fin de bande dans l'afficheur, les pages détail et la newsletter qui n'enregistre rien. Prouvé par la naissance de `g2g-verif`, quatre-vingt-six contrôles tous passés, et par le retour et l'avance du navigateur avec la position de l'extrait qui avance à chaque étape. Coût : l'afficheur tient en deux rangées parce que trois ne tiennent pas, et le mouvement n'est pas mesurable image par image en headless, d'où les contrôles sur transition figée.

### Phase 6 — Finition et audits, avec le bloc 5.1 — 10 octobre 2026
`cd495c8` (bloc 5.1), `191dc74`, `df6c534` et `16e9b32` (finition et audits)

Le bloc 5.1 pose les lambeaux en fractions d'écran avec leur trace d'impression et corrige un liseré inversé. La Phase 6 fait les audits : la performance mobile passe de 77 à 91-93 et le desktop à 100 partout, par le ticker natif, le chargement de GSAP et Lenis à l'inactivité, la compilation du shader en parallèle et un shader allégé ; l'accessibilité donne quarante-deux contrôles passés et zéro violation axe-core sur onze pages aux deux formats. Coût : le seuil de 95 en mobile n'est pas atteint, le LCP simulé étant borné par cent vingt-quatre kilo-octets de polices ; le SEO reste à 63-66 par le `noindex` voulu ; VoiceOver et Safari restent à passer à la main.

### Bloc 6.1 — LCP mobile et polices — 11 octobre 2026
`33145ef` (code), `6d04867` (captures et rapports)

Les trois polices sont sous-ensemblées et auto-hébergées, Archivo restreinte à ses plages réellement utilisées : soixante-neuf kilo-octets avant le LCP au lieu de cent vingt-quatre. Le rendu est prouvé identique par comparaison pixel à pixel de six captures, l'écart moyen restant sous un demi-niveau sur 255. La preview devient la mesure de référence et le critère tombe : 99, 95, 98 et 95 en performance, en médiane de cinq passages. Coût : le hinting est retiré, ce qui explique l'écart résiduel ; VT323 est encore demandée au premier rendu et n'en sortira qu'au bloc 7.4c.

### Blocs 7.0 et 7.1, et audit de la Phase 7 — 11 octobre 2026
`62d8745` (7.0), `3b86090` (7.1), `bb59a3e` (audit), fusion de la PR #5 (`139b88b`)

Le label donne carte blanche : le site devient sa plateforme officielle, les mentions de concept disparaissent du skin, du pied de page et des métadonnées, le crédit du site apparaît, la canonical devient paramétrable, et un audit d'extractibilité recense toutes les attaches au portfolio sans rien couper. Première fusion sur `main` et unique écriture en base, avec contrôles des deux côtés : neuf lignes avant, dix après, retour arrière documenté. L'audit compare quatre CMS sans rien installer et recommande Sanity en offre gratuite, Studio hébergé à part, pipeline médias en Action GitHub. Coût : la tuile n'apparaît qu'après un redéploiement, la home étant prérendue ; le point d'attention sur l'audio d'une autre origine occupera tout le bloc 7.5.

### Phase 7.2 — Studio Sanity, schémas et import, avec le bloc 7.1b — 11 octobre 2026
`be3ee8c` (7.1b), `bbd31a1` et `53733d6` (7.2), `bb953c8` (compte-rendu), fusion de la PR #6 (`7b18b5c`)

La tuile est rendue avec les vraies polices par une page hors navigation, capturée et exportée en images, ce qui remplace le SVG dessiné à la main. Le Studio est déployé avec ses schémas et ses aides en français pour des non-techniciens, et le contenu TypeScript est transformé en ndjson puis importé : quarante-cinq documents et vingt images en huit secondes, identifiants stables et références entre artistes et sorties. Prouvé par la validation : zéro erreur de schéma, et trente-sept documents valides sur quarante-cinq, les huit restants étant exactement les crédits de flyers inconnus — c'est la règle du crédit obligatoire qui fonctionne. Coût : les captures desktop viennent du Studio local ; l'organisation est créée par l'API ; le site lit toujours le TypeScript.

### Phase 7.3 — Le site lit Sanity, avec le bloc 7.2b — 11 octobre 2026
`662a6eb` (7.2b), `adbbfbb` et `0027498` (7.3), `57ef652` (compte-rendu), `30a5a8b` (exclusion du Studio du type-check), fusions des PR #7 (`3ff1c28`) et #8

Le dataset passe en privé et le site le lit avec un jeton de lecture ; la case « auteur non identifié » clôt les huit crédits manquants et le dataset devient entièrement valide. Une seule dépendance est ajoutée et un adaptateur convertit les documents vers les types existants, si bien qu'aucun composant d'affichage ne change ; cache par tags, revalidation par route signée, aperçu par secret à usage unique, instantané commité en repli. Prouvé par une publication visible en production en sept secondes et quatre dixièmes sans rebuild, par quatre-vingt-six contrôles de mise en page et quarante-deux d'accessibilité, un Lighthouse au même niveau et un bundle public inchangé. Coût : l'édition visuelle est écartée pour ne pas tirer une dépendance d'interface ; l'instantané vieillit dès qu'on ne le régénère pas ; images et extraits restent dans le dépôt jusqu'à la phase suivante.

### Bloc 7.3b — Le lecteur par tout chemin d'arrivée — 12 octobre 2026
`f5f0147` (diagnostic et premier correctif), `2794253` (mécanisme définitif), fusion de la PR #9 (`ac50d1f`)

Un `<script>` rendu par React au cours d'une navigation côté client est inséré dans le DOM sans jamais être exécuté : en arrivant par la tuile du portfolio, la page servait l'état « sans JavaScript », barre statique et lecteur absent. Le défaut existait depuis la Phase 3 et était atteignable depuis le bloc 7.1 ; il est remplacé par une racine cliente qui s'active au montage de React et par un repli en `<noscript>`. Prouvé par un `g2g-verif` porté de quatre-vingt-six à cent cinquante-quatre contrôles — quatre chemins d'arrivée, exécution réelle du lecteur au premier vrai clic, tolérance zéro sur les erreurs — avec cent quatorze sur cent vingt avant correctif, les six échecs étant exactement l'anomalie. Coût : plusieurs affirmations des Phases 3, 7.1b et 7.3 sont invalidées et consignées ; les commandes du lecteur apparaissent désormais à l'hydratation, ce qui sera mesuré comme un décalage de mise en page à la phase suivante.

### Phase 7.4 — Pipeline médias depuis Sanity — 12 octobre 2026
`1e50463` (pipeline, schémas, Action), `c8b1d33` (le site sert les médias depuis Sanity), `5bca3d7` (géométrie stable à l'hydratation), fusion de la PR #10 (`e370161`)

Le label dépose ses fichiers d'origine dans le Studio et le pipeline fait le reste : déclinaisons d'images sans recadrage, couleurs et contrastes, découpe et normalisation des extraits, sonie et tempo, état visible document par document, empreinte pour ne rien retraiter deux fois. Le site sert tout depuis le CDN ; le contenu TypeScript, les médias du dépôt et six scripts devenus inutiles sont retirés, soit près de quinze mégaoctets de moins. Prouvé par vingt documents prêts et deux cent un fichiers dans Sanity, et par cent cinquante-quatre contrôles sur cent cinquante-quatre contre la preview puis la production — le spectre ne bougeant que si l'audio d'une autre origine est analysable, c'est la preuve des en-têtes en conditions réelles. Coût : le décalage de mise en page hérité du bloc précédent, mesuré entre 0,087 et 0,121, est corrigé par une media query native ; la page sortie tombe de 97 à 95 ; la latence du pipeline peut atteindre quinze minutes faute de relais.

### Bloc 7.4b — Clôture, image LCP, latence du pipeline — 12 octobre 2026
`6246b25` (relais), `7a4e7a8` (ffmpeg dans l'Action), `173a68a` (préchargement LCP), `d03923a` (variante même origine), fusion de la PR #11 (`5f59fee`)

Le composant d'image pose lui-même le lien de préchargement de l'image LCP, ce qui fait tomber le délai avant la requête de 354 à 22 millisecondes — sans que le score bouge, le LCP simulé étant borné par les octets qui passent avant l'image et non par sa découverte. Le relais du webhook vers l'Action est mis en place et la chaîne mesurée pour la première fois de bout en bout : cent quatre secondes et six dixièmes, dont quatre-vingt-dix-sept pour la seule Action. La variante « médias par notre origine » est déployée, mesurée sur cinq passages et écartée. Coût : l'objectif de 97 sur la page sortie devient un arbitrage assumé ; le filtre fin du webhook ne livre rien, d'où un filtre large et des exécutions à vide.

### Bloc 7.4c — Action allégée, afficheur hors du chemin critique — 12 octobre 2026
`60905d1` (afficheur et Action), `79c6fb9` (ffmpeg), `329ad17` (configuration npm)

L'Action passe de quatre-vingt-dix-sept à quarante et une secondes par un checkout partiel et un ffmpeg repris du cache, et une requête préalable unique fait tomber une exécution à vide de soixante-dix à huit secondes. La police de l'afficheur sort du chargeur de polices, qui la préchargeait par en-tête HTTP même déclarée sans préchargement : elle n'est plus demandée du tout sans JavaScript. Prouvé par cent cinquante-six contrôles tous au vert, une géométrie d'afficheur identique au pixel avant et après l'arrivée de la police, et quarante-trois kilo-octets de polices avant le LCP au lieu de quarante-huit. Coût : le gain est réel mais invisible dans le score ; la mesure de bout en bout est impossible depuis une branche ; la disparition des dix-sept comptes-rendus reste inexpliquée, d'où une archive désormais fabriquée hors du dépôt.

### Bloc 7.5a — Lecteur muet sur iPhone — 12 octobre 2026
`a72a4d2`

Le serveur est mis hors de cause relevé par relevé : requête préparatoire acceptée avec l'en-tête de plage, réponses partielles correctes, refus seulement pour une origine non déclarée, fichier audio parfaitement banal. Faute du moindre WebKit pilotable, le candidat « livraison par une autre origine » est retiré en basculant les médias sur notre origine, et surtout le lecteur cesse d'être muet : une veille de trois secondes déclare l'extrait indisponible, l'afficheur l'écrit et renvoie sur Bandcamp. Prouvé par un contrôle qui coupe les requêtes audio au niveau du réseau, portant le total à cent soixante. Coût, dit franchement : ce n'est pas un correctif établi mais le retrait d'un candidat — et la bascule sur notre origine se révélera être le vrai défaut au bloc suivant.

### Bloc 7.5b — Le CDN rétabli, le piège du cache nommé — 12 octobre 2026
`3f20441`

Les essais sur appareil désignent la livraison par notre domaine, et seulement elle : le cache de périphérie mémorisait la sonde de deux octets qu'iOS envoie en première requête, puis servait ces deux octets à toutes les requêtes complètes, le lecteur calant sans la moindre erreur. Le CDN redevient la livraison par défaut, et la réécriture est remplacée par une route de relais qui décide elle-même du cache, prouvée sur une adresse neuve en trois requêtes. Au passage, la preview jouait parce que ses adresses étaient déjà en cache complet : le bon fonctionnement dépendait de qui avait demandé le fichier en premier. Coût : un fichier créé dans la route de l'application hors de l'habitude de validation ; la production cesse de servir de référence, étant deux blocs en arrière ; le repli par tampon décodé est documenté sans être écrit.

### Phase 7.5 — Clôture et autonomie du label — 12 octobre 2026
`main` à `d0141f4` (fusion de la PR #12)

La clôture est vérifiée par marqueurs servis en production plutôt que par l'historique, avec cent soixante contrôles sur cent soixante. Le silence observé sur iPhone l'avant-veille est clos faute de cause subsistante : les sept fichiers audio de la page sorties sont interrogés comme le fait un iPhone et tous conformes, et le build de ce moment-là n'avait ni l'état d'échec ni les correctifs suivants. Côté label, le guide d'une page est écrit et lu tel quel par le Studio, la liste de ce qu'il doit compléter est relevée dans le contenu publié, et la marche à suivre des invitations est posée sans qu'aucun compte soit créé. Prouvé par la mesure réelle du pipeline en production : cinquante-deux secondes pour ce qui dépend de nous. Coût : la propagation jusqu'à la périphérie a pris une centaine de secondes contre trois et demie au bloc précédent, sans explication établie.

### Phase 7.6 — Guide, durée, brouillons — 13 octobre 2026
`efe59a5`

Le guide du label gagne la première connexion, la fiche artiste et les règles de dépôt des images, et dit la réversibilité exactement, à ses deux endroits utiles. La saisie des durées devient humaine dans le Studio sans que le stockage change, et un drapeau permet de ne rien publier du tout d'un texte encore en brouillon. Prouvé par les trente-sept durées relevées avant et après à l'identique, un dataset entièrement valide, des planches aux deux formats dans les deux états où le détecteur ne relève rien, et un `g2g-verif` porté à cent quatre-vingt-deux contrôles. Coût : trois pages écrivaient la mention « brouillon » en dur, ce qui serait resté après validation par le label ; le message de la newsletter ne peut pas disparaître puisqu'il énonce un fait.

### Phase 7.7 — Gabarit artiste, chronologie, registre public — 13 octobre 2026
`733d239` (code), `d1c9101` (compte-rendu)

Le gabarit des pages d'artistes est refait pour le cas réel — une sortie, aucun texte, aucun portrait — le défaut ayant été vu sur une page rendue et non dans le code : un filet de deux pixels flottait seul quand aucune piste n'était créditée. Une seule charte d'en-tête tire le papier de l'affiche de la dominante de la pochette, la chronologie est composée à partir des champs, et le registre public est tenu en trois endroits par une seule expression partagée entre le site, la barrière de saisie du Studio et le contrôle de rendu. Prouvé par la barrière passée sur les neuf cent vingt-quatre chaînes du contenu publié, qui en refuse deux et seulement deux, par `g2g-verif` porté à deux cent quatre contrôles, et par un détecteur de creux à zéro défaut sur les dix-neuf pages d'artistes. Coût : une seule écriture en base, un champ, sous garde de révision ; douze des dix-neuf affiches basculaient encore sur la palette ; deux relevés de la journée ont été faussés par un serveur local périmé et par une page prérendue resservie.

### Phase 7.8 — Corrections de 7.7, soirées sur les pages d'artistes, ménage du dépôt — 13 octobre 2026
`7fc8271` (code), puis le commit du ménage

La chronologie cesse de sur-corriger : « Soirée » n'est omis que si le titre le porte déjà, deux lignes sur dix-sept redeviennent identifiables, les quinze autres sont inchangées au caractère près. Le papier de l'affiche n'est plus remplacé par une couleur de palette mais éclairci à teinte constante, saturation et clarté plafonnées — sept dominantes telles quelles, douze éclaircies, aucune de palette — et le seuil de 4,5:1 devient un arbitrage écrit, tenu par un contrôle qui échoue si un petit texte se pose un jour sur l'affiche. Les pages d'artistes gagnent les soirées où l'artiste figure au line-up, par correspondance exacte sur le nom normalisé : treize correspondances pour six artistes sur dix-neuf, trente-six noms sans correspondance laissés tels quels plutôt que rapprochés. Prouvé par `g2g-verif` porté à deux cent vingt-six contrôles, passés en local et sur la preview, quarante-deux en accessibilité, zéro creux sur les dix-neuf pages. Enfin le dépôt est nettoyé : le brief absorbe tout ce qui ne vivait que dans les comptes-rendus, ceux-ci deviennent ce fichier, les planches et les rapports Lighthouse sortent du dépôt et neuf scripts de phase sont supprimés — de 270 Mo et 417 fichiers à moins de 1 Mo dans `docs/groove-to-grave/`.
