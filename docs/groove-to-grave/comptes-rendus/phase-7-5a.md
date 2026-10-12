# Groove To Grave — compte-rendu du bloc 7.5a (lecteur muet sur iPhone)

12 octobre 2026 · branche `experience/groove-to-grave` · commit `a72a4d2` · preview de la branche https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app

## 1. Ce que l'observation établit, et ce qu'elle n'établit pas

**Ta piste est fausse telle qu'elle est formulée.** Le CDN Sanity sert nos fichiers en cross-origin, avec les requêtes Range, sans la moindre faute. Relevé :

| Requête | Réponse |
|---|---|
| `OPTIONS` MP3, `Origin:` production, `Access-Control-Request-Headers: range` | **204**, `access-control-allow-origin: https://portfolio-eight-sable-66.vercel.app`, **`access-control-allow-headers: range`**, `access-control-allow-methods: GET`, `access-control-max-age: 600` |
| `GET` MP3, `Origin:` production, `Range: bytes=0-1` | **206**, `content-range: bytes 0-1/1081512`, `accept-ranges: bytes`, `access-control-allow-origin` présent |
| Même `GET`, **sans** `Origin` | 206, mêmes en-têtes de plage, pas d'en-tête CORS (normal) |
| Mêmes requêtes avec un **agent iPhone 17.6** | identiques : 204 et 206, CORS et plage servis |
| `GET` MP3 avec une origine non déclarée | **403** (c'est bien la liste CORS qui garde la porte, et notre origine y est) |
| Image AVIF, mêmes essais | identiques : 204 et 206 avec CORS |

Le fichier lui-même est au-dessus de tout soupçon : `ffprobe` donne MPEG-1 layer 3, 44,1 kHz, mono, 192 kb/s, 45 s, `content-type: audio/mpeg` — le format le plus banal qui soit pour iOS.

**Donc : ni le CORS, ni les requêtes Range, ni le format, ni l'origine refusée.** Le serveur est hors de cause ; ce qui bloque est dans WebKit, et je n'ai pas pu l'observer.

**Je n'ai aucun WebKit pilotable ici**, et je le dis plutôt que de conclure à ta place :
- **Playwright WebKit** installé hors du dépôt (`~/.cache/g2g-webkit`, rien dans le projet) : le navigateur se lance en 111 ms, le contexte se crée… et `newPage()` ne répond jamais, en mode visible comme en headless, avec ou sans bac à sable. Build `webkit_mac14_arm64_special-2251`, Playwright 1.64, macOS 14.
- **Safari par `safaridriver`** : « You must enable 'Allow remote automation' in the Developer section of Safari Settings » — c'est une case à cocher dans tes réglages, je ne peux pas la cocher.
- Chrome headless, lui, joue parfaitement l'extrait : il ne reproduit pas le bug, et ne pouvait donc pas l'attraper.

**La cause reste donc à établir, sur ton appareil.** Deux candidats, et un seul essai les sépare : la livraison par une autre origine (WebKit est plus strict que Chromium sur les médias d'une autre origine routés dans Web Audio, même avec un CORS correct), ou le routage Web Audio lui-même (`createMediaElementSource`, connu pour des surprises sur iOS). J'ai préparé l'essai qui tranche (§3) ; en attendant, j'ai retiré le premier candidat, parce qu'il ne coûte rien.

## 2. Ce qui est corrigé

**Les médias passent par notre origine, par défaut.** `G2G_MEDIAS_MEME_ORIGINE` n'est plus un drapeau à poser : la réécriture Next `/experience/groove-to-grave/media/<fichier>` → CDN Sanity est le comportement normal (`=0` revient à la livraison directe, pour comparer). Mesuré sans perte au bloc 7.4b (95 · 2,90 s sur la page sortie, dans le bruit). Vérifié sur la preview : plus une seule adresse `cdn.sanity.io` dans les pages, et la réécriture **transmet bien les plages** — `Range: bytes=0-100` → **206**, `content-range: bytes 0-100/1081512`, `accept-ranges: bytes`, `content-type: audio/mpeg`. Effet de bord utile : l'audio n'est plus une ressource d'une autre origine, donc plus aucune déclaration CORS à tenir pour le lecteur.

Je le dis clairement : **ce n'est pas un correctif établi, c'est le retrait d'un candidat.** Si ton essai montre que le routage Web Audio est en cause, il faudra autre chose (lecture sans analyseur sur iOS, par exemple), et je m'y mettrai avec ton relevé.

## 3. Le bug était muet : il ne l'est plus

Le moteur soufflait dans le vide, sans rien dire. Désormais :
- le moteur arme une veille de **3 secondes** au moment du geste ; si pas une seconde d'extrait n'a été jouée dans ce délai, ou si l'élément audio émet une erreur, ou si `play()` est refusée, l'extrait est déclaré indisponible ;
- l'afficheur l'écrit en clair, en rouge d'alerte : **« EXTRAIT INDISPONIBLE · BANDCAMP »**, le lien pointant sur la sortie concernée (`role="status"`, donc annoncé aussi aux lecteurs d'écran) ;
- le souffle est coupé, le transport revient à l'arrêt, le compteur à zéro.

Captures : `planches/phase-7.5a/1440-extrait-indisponible.jpg` et `390-extrait-indisponible.jpg` (le message tient dans la barre mobile, le lien n'est pas tronqué).

**`g2g-verif` couvre le cas** : un nouveau contrôle coupe les requêtes `*.mp3` au niveau du réseau (protocole DevTools), clique sur écouter, et exige que le message soit visible, que le lien Bandcamp soit là, et que le lecteur ne reste pas en lecture. **160 contrôles** (154 + 2 × 2 nouveaux, aux deux formats) : **160/160 en local et 160/160 sur la preview**, médias servis par notre origine ; `g2g-a11y` 42/42 ; tokens 19 paires ; `tsc`, lint et build propres.

## 4. Ce que tu dois vérifier sur l'iPhone, dans l'ordre

Tout se passe sur la **preview de la branche** (la production garde l'ancien comportement tant que tu n'as pas fusionné) :
`https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app`

1. **L'essai qui tranche.** Ouvre `…/experience/groove-to-grave/diagnostic.html`. Appuie sur **Essai 0** (réseau), puis sur **A**, **B**, **C**, **D**, **E**, un par un, en attendant les 4 secondes de chacun. Chaque bouton est un geste distinct : iOS l'exige. Puis copie le résumé en bas de page et envoie-le-moi. Ce que chaque essai sépare : A (audio nu, CDN) et B (audio nu, notre origine) montrent si l'origine est en cause ; C (CDN + Web Audio) est exactement ce que faisait le site ; D (notre origine + Web Audio) est ce qu'il fait maintenant ; E est D sans le ralenti de démarrage.
2. **Le lecteur lui-même.** `…/experience/groove-to-grave/sorties`, appuie sur le bouton rond d'une cassette : est-ce que le morceau démarre, le compteur avance-t-il, le spectre bouge-t-il ?
3. **Si rien ne démarre**, attends trois secondes : le message « EXTRAIT INDISPONIBLE · BANDCAMP » doit apparaître dans la barre du bas et le souffle doit s'arrêter. Dis-moi s'il apparaît (c'est le point 3 de ce bloc) — et le lien doit ouvrir Bandcamp.
4. **Si ça joue**, vérifie que la navigation ne coupe pas le son : passe à « artistes » puis reviens, le son doit continuer.
5. **Verrouille l'écran** une seconde et déverrouille : le lecteur doit passer en pause proprement, pas rester bloqué.

Un seul de ces cinq points me manque pour conclure ; le premier suffit à nommer la cause.

## 5. Brief et automatisation

Écrit dans le brief, en règle ferme : **notre automatisation ne couvre pas WebKit** (`g2g-verif`, `g2g-a11y`, planches, vidéos et Lighthouse tournent tous dans Chromium), donc **tout ce qui touche la livraison des médias (origine, CORS, Range, formats) ou le moteur audio n'est « fait » qu'après un essai sur un iPhone réel.** Les 160 contrôles prouvent le comportement sur Chromium, pas sur WebKit.

Contrôle WebKit ponctuel, comme demandé, sans alourdir le dépôt : `scripts/g2g-webkit.ts` résout Playwright depuis `~/.cache/g2g-webkit` (hors dépôt, à installer une fois en deux lignes documentées en tête du script) et rend compte de l'état réel de l'élément audio. Il est écrit, typé sans `any`, et **il échoue proprement ici** (« ouverture d'une page WebKit : aucune réponse en 20 s ») : il servira le jour où Playwright WebKit marchera sur cette machine, ou ailleurs. En attendant, la page `diagnostic.html` sur l'appareil est notre WebKit.

## 6. Reste

- Ton relevé du point 4.1, qui nomme la cause ; ensuite, correctif définitif s'il en faut un autre, puis fusion.
- Phase 7.5 (autonomie du label) : toujours après ta validation.
