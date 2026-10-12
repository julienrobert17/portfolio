# Groove To Grave — compte-rendu du bloc 7.3b (le lecteur par tout chemin d'arrivée, vérification contre la production)

12 octobre 2026 · branche `experience/groove-to-grave` · commits `f5f0147` (diagnostic, premier correctif, g2g-verif contre la production) et `2794253` (mécanisme définitif, quatre chemins d'arrivée) · fusion sur `main` : PR #9 (`ac50d1f`) · déploiement de production `portfolio-6lq6gtjy8` · https://portfolio-eight-sable-66.vercel.app/experience/groove-to-grave

## 1. État des lieux à la reprise

- **Commité et poussé** : `f5f0147` (branche et `origin`, PR #9 ouverte, non fusionnée). `origin/main` était encore à `098e610` (PR #8). Rien d'autre en attente, hormis `phase1.txt` à la racine du worktree, non suivi : une copie de terminal du 10 octobre qui n'est pas à moi, laissée telle quelle.
- **Processus** : mon serveur `next start -p 3999` tournait encore, arrêté. Aucun Chrome headless, aucun Lighthouse, aucun `sanity dev`. Un `npm run dev` (PID 37029) tourne depuis le dépôt principal, lancé le 12 octobre à 10:19 : il n'est pas à moi, je ne l'ai pas touché.
- **Build local** : échouait sur la home `/` (prérendue, Prisma `ECONNREFUSED`) parce que le worktree n'a pas de `.env` ; lien symbolique vers le `.env` du dépôt principal (ignoré par git, rien n'est copié ni commité).

## 2. Les deux anomalies

### A — « Le lecteur a besoin de JavaScript » en production

**Observation** (navigateur réel et Chrome piloté, production) : en chargeant l'URL directement, `#haut[data-js]` est posé, le lecteur est visible, aucune erreur de console. En arrivant **par la tuile du portfolio** (home → « Découvrir mes projets » → tuile, navigation Next Link sans rechargement), la même page donne `dataJs: false`, barre statique `display: flex`, rangée des commandes `display: none`, classe `g2g-document` absente ; la balise `<script>` en ligne du layout est bien dans le DOM mais n'a pas été exécutée. **Cause** : un `<script>` rendu par React au cours d'une navigation côté client est inséré dans le DOM sans être exécuté ; seul un chargement complet de la page l'exécute. Tout ce que l'expérience faisait dépendre de ce script (`data-js`, `g2g-document`) manquait donc par ce chemin.

**Mécanisme retenu** (`2794253`), en deux phrases. La racine `.g2g` est désormais un composant client (`layout/racine.tsx`) qui pose `data-js` par `useSyncExternalStore` (`false` au rendu serveur et à l'hydratation, `true` dès que React rend dans le navigateur) et la classe `g2g-document` dans un effet avec nettoyage : c'est le montage React lui-même qui active le lecteur, et React monte la racine par tout chemin d'arrivée (URL directe, tuile, lien interne, retour et avance), il n'existe pas de chemin où le composant est dans le DOM sans avoir été rendu par React. Le repli sans JavaScript (« Le lecteur a besoin de JavaScript », lien Bandcamp) est dans un `<noscript>`, rendu par le navigateur seul quand aucun script ne tourne et jamais rendu sinon ; il n'y a plus aucun script en ligne, plus aucune règle `.g2g-sans-js`, donc plus rien qui puisse retomber dans le piège d'une balise injectée.

Coût assumé : sur un chargement direct, les commandes du lecteur (classe `g2g-js`) apparaissent à l'hydratation et non au premier paint (le script en ligne les montrait avant). C'est un enrichissement progressif correct : elles ne sont visibles que lorsqu'elles fonctionnent ; le message de repli, lui, ne clignote jamais puisqu'il est dans le `noscript`.

### B — tuile en 404 en local

Le checkout principal (`/Users/julienr/Desktop/portfolio`, branche `main`) n'avait jamais été mis à jour après les fusions faites par l'API GitHub (60 commits de retard, la route n'existait pas localement). `git pull --ff-only` le 11 octobre, et de nouveau aujourd'hui après la PR #9. Rien dans le code.

## 3. g2g-verif, renforcé définitivement (154 contrôles)

- **Contre une URL de production** : `--url https://…` (déjà accepté, désormais la règle de clôture).
- **Erreurs** : sur chaque page et chaque parcours, exceptions (`Runtime.exceptionThrown`), `console.error`, et erreurs réseau ou navigateur (`Log.entryAdded`, requêtes en échec), tolérance zéro ; seuls les avertissements du pilote graphique de SwiftShader sont ignorés. Les évaluations dans la page remontent leurs exceptions au lieu de rendre `undefined` (le script plantait sur l'ancien build de production au lieu de signaler l'échec).
- **Exécution réelle du lecteur, quatre chemins d'arrivée, deux formats** (`controlerLecteurReel`) : lecteur monté (`data-js`, commandes rendues, barre du `noscript` non rendue, boutons écouter) ; au **premier vrai clic** (`Input.dispatchMouseEvent`, geste utilisateur) sur le bouton écouter de la première cassette, `window.__g2g.etatAudio()` passe de `absent` à `running` et le lecteur est en `lecture` ; la position de l'extrait avance entre deux lectures à 700 ms ; les 32 colonnes du spectre (`transform` des niveaux) changent entre deux images ; aucune erreur de console sur le parcours.
  1. **URL directe** `/sorties` ;
  2. **tuile** : home du portfolio, « Découvrir mes projets », tuile (Next Link) → accueil de l'expérience ;
  3. **lien interne** : accueil → `/sorties` par le lien du lecteur ;
  4. **retour puis avance** : accueil → `/sorties`, `history.back()` (accueil, `data-js` encore posé), `history.forward()` → `/sorties`.
- Le moteur expose `etatAudio()` (`AudioContext.state`, ou `absent`).
- Réserve honnête : Chrome headless est lancé avec `--autoplay-policy=no-user-gesture-required` (les vidéos et captures en dépendent) ; le contrôle prouve que l'AudioContext n'est créé et démarré que par le clic (état `absent` avant, `running` après), pas que la politique d'autoplay d'un navigateur ordinaire est satisfaite — ce point a été vérifié à la main dans Chrome le 11 octobre et l'est par la capture ci-dessous.

**Avant correctif, contre la production (annexe `phase-7-3b-g2g-verif-production-avant.md`, version 120 contrôles du script)** : 114/120, les six échecs sont exactement l'anomalie A aux deux formats (`dataJs:false`, barre statique `flex`, lecteur `none`, aucune lecture après la tuile).

## 4. Fusion, déploiement, preuve en production

PR #9 fusionnée (`ac50d1f`), déploiement `portfolio-6lq6gtjy8` prêt. Le HTML servi en production contient `<noscript><div class="g2g-lecteur__statique">` et plus aucun script `data-js`.

**`npx tsx scripts/g2g-verif.ts --url https://portfolio-eight-sable-66.vercel.app` : 154/154.** Résultat complet en annexe `phase-7-3b-g2g-verif-production.md`. Extrait des quatre chemins :

| Format | Chemin | AudioContext au premier clic | Position | Spectre | Console |
|---|---|---|---|---|---|
| 1440 | URL directe → /sorties | absent → running, lecture | 0,66 → 1,36 s | 32/32 colonnes, change | ok |
| 1440 | tuile du portfolio → accueil | absent → running, lecture | 1,09 → 1,79 s | 32/32, change | ok |
| 1440 | lien interne accueil → /sorties | absent → running, lecture | 1,09 → 1,80 s | 32/32, change | ok |
| 1440 | retour puis avance → /sorties | absent → running, lecture | 1,09 → 1,80 s | 32/32, change | ok |
| 390 | URL directe → /sorties | absent → running, lecture | 0,98 → 2,21 s | 32/32, change | ok |
| 390 | tuile du portfolio → accueil | absent → running, lecture | 1,08 → 2,31 s | 32/32, change | ok |
| 390 | lien interne accueil → /sorties | absent → running, lecture | 1,09 → 2,33 s | 32/32, change | ok |
| 390 | retour puis avance → /sorties | absent → running, lecture | 1,08 → 2,32 s | 32/32, change | ok |

(Valeurs de l'exécution locale, identiques en nature à l'exécution de production de l'annexe.) La lecture sans coupure (lien, retour, avance) et la transition figée restent contrôlées comme avant.

**Captures de production** (`planches/phase-7.3b/`, `scripts/g2g-capture-entree.ts`) : `1440-1-tuile.jpg` et `390-1-tuile.jpg` (la tuile sur la home du portfolio), `*-2-arrivee.jpg` (l'accueil de l'expérience atteint sans rechargement, lecteur monté), `1440-3-lecture-running-lecture-1.4s.jpg` et `390-3-lecture-running-lecture-2.0s.jpg` : le lecteur en lecture après un vrai clic, spectre allumé, compteur à 00:01, AudioContext `running`, barre statique non rendue (l'état est écrit dans le nom du fichier par le script).

Local, même build : g2g-verif 154/154, g2g-a11y 42/42 (le mode sans JavaScript voit la barre du `noscript` rendue, les commandes absentes), tokens 19 paires, `tsc`, lint et build propres.

## 5. Depuis quand, et ce que cela invalide

- **Depuis la Phase 3** (`e17613e`, 10 octobre, « lecteur et son ») : c'est là que le script en ligne `data-js` et les classes `g2g-js` / `g2g-sans-js` sont nés. Le bug existait dès ce commit pour toute navigation côté client vers l'expérience, mais aucun chemin de ce type n'existait avant la **tuile du bloc 7.1** (11 octobre, ligne en base et home redéployée) : c'est à partir de là qu'un visiteur pouvait le rencontrer. Les Phases 7.2 et 7.3 l'ont livré tel quel en production (PR #6, #7, #8).
- **Pourquoi rien ne l'a vu** : g2g-verif, g2g-a11y, les planches, les vidéos et Lighthouse ouvrent chaque page par un chargement complet (le script en ligne s'exécute) ; `g2g-capture-home.ts` (7.1b) suivait bien la tuile par navigation côté client, mais ne vérifiait que `location.pathname`.
- **Affirmations invalidées** :
  - `phase-3.md` : « attribut `data-js` posé par un script en ligne avant le premier paint » et « sans JavaScript : barre de titre, navigation et lien Bandcamp ; le reste du lecteur n'existe pas dans le rendu », présentés comme le comportement général : vrais sur chargement direct seulement ; avec JavaScript mais par navigation côté client, c'était l'état « sans JavaScript » qui était servi.
  - `phase-7-2.md`, bloc 7.1b, « Production : … vérifié par `scripts/g2g-capture-home.ts` : tuile en première position… » : la vérification s'arrêtait au chemin d'arrivée ; la page atteinte par la tuile n'avait pas de lecteur.
  - `phase-7-3.md`, point 4, « Non-régression. `g2g-verif.ts` 86/86 … aucune différence qui viendrait de la lecture Sanity elle-même » : exact pour ce que le script mesurait, mais 86/86 ne couvrait pas l'exécution réelle du lecteur ni l'entrée par la tuile ; la formulation laissait croire à une expérience vérifiée en production.
  - Les captures et vidéos des Phases 5, 6, 6.1, 7.3 restent exactes pour ce qu'elles montrent (chargement direct), mais ne prouvaient pas le parcours réel d'un visiteur du portfolio.
  - `phase-7-audit.md`, point 4 « Tuile en production » : la tuile était bien en production ; ce qu'elle ouvrait ne l'était pas fonctionnellement.

## 6. Autres écarts entre local et production relevés

- `/api/g2g/apercu/fin` redirige vers l'origine canonique (`G2G_URL_SITE` ou l'URL de production) : en local, quitter l'aperçu renvoie sur la production. Attendu, mais à savoir.
- Le webhook Sanity ne vise que la production ; en local, une publication n'est visible qu'au prochain chargement sans cache (`next dev`) ou jamais (`next start`, cache tags) ; l'outil Aperçu du Studio déployé pointe aussi la production.
- La home du portfolio est prérendue au build : une ligne `Project` changée en base n'apparaît qu'après redéploiement (déjà noté en 7.1).
- Le worktree n'a pas de `.env` : `npm run build` y échoue sur la home (Prisma) tant que le lien vers le `.env` principal n'existe pas ; en production, la variable est posée. Lien symbolique créé, ignoré par git.
- Le checkout principal doit être mis à jour à la main après chaque fusion par l'API (anomalie B).

## Règle permanente

Brief : « une phase n'est terminée que lorsque `scripts/g2g-verif.ts` a été exécuté contre l'URL de production, après déploiement, et que son résultat complet figure dans le compte-rendu ; le lecteur doit y avoir été vérifié en fonctionnement réel par les quatre chemins d'arrivée, aux deux formats ». Appliquée dès la Phase 7.4.

## Reste

- Phase 7.4 : pipeline médias depuis Sanity (couleurs, extraits, AVIF et WebP), puis retrait du contenu TypeScript ; clôture par g2g-verif contre la production.
- Relancer `g2g-instantane-sanity.ts` avant chaque mise en production tant que le contenu bouge.
