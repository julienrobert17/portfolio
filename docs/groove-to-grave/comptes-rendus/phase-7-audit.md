# Groove To Grave — compte-rendu des blocs 7.0 et 7.1, et audit de la Phase 7 (autonomie du label)

11 octobre 2026 · branche `experience/groove-to-grave` (commits `62d8745` bloc 7.0, `3b86090` bloc 7.1, `bb59a3e` ce compte-rendu) · fusion sur `main` par la PR #5 (`139b88b`) · production https://portfolio-eight-sable-66.vercel.app/experience/groove-to-grave

## Bloc 7.0 — plateforme officielle

1. **Mentions retirées.** Tampon du skin (`layout/lecteur.tsx` et ses règles CSS), texte du pied de page, titres des métadonnées (`layout.tsx`, `page.tsx`), brief. Pied de page : « Site réalisé par Julien Robert pour Groove To Grave Records. » puis « Pochettes, flyers, illustrations et textes de sortie appartiennent à Groove To Grave Records et à leurs auteurs : JeunePenard, LukasDarian, Cbrgraphics. Textes marqués « brouillon » en attente de validation par le label. » ; crédits artwork par pochette et `flyerCredit` par flyer inchangés. Vérifié en production : zéro occurrence de « concept non officiel ».
2. **`noindex` et canonical.** `robots: { index: false, follow: false }` conservé avec un commentaire qui l'explique (domaine final non choisi). Origine canonique paramétrable : `G2G_URL_SITE` (sans barre finale), repli sur l'URL du portfolio ; `metadataBase` et `alternates.canonical` absolus. En production : `<link rel="canonical" href="https://portfolio-eight-sable-66.vercel.app/experience/groove-to-grave">`.
3. **Autonomie et extractibilité** (rien n'est coupé). Tout ce qui est propre à G2G est regroupé : `src/components/experience/groove-to-grave/` (composants, contenu, styles, polices, tokens, audio, canvas), `src/app/experience/groove-to-grave/` (route), `scripts/g2g-*.ts` et `generate-g2g-tuile.ts`, `public/experience/groove-to-grave/`, `content/groove-to-grave/`, `docs/groove-to-grave/`. Attaches au reste du portfolio à couper pour une application Next indépendante :

| Attache | Où | Pour une application indépendante |
|---|---|---|
| Hook `@/lib/use-reduced-motion` | 3 imports (`canvas/mur.tsx`, `layout/smooth-scroll.tsx`, `ui/bande-defilante.tsx`) | copier dans `groove-to-grave/lib/` |
| Layout racine du portfolio | `src/app/layout.tsx` : `<html lang>`, `globals.css` (Tailwind), polices Geist, curseur, en-tête et pied conditionnels masqués par `IMMERSIVE_PREFIXES` (`src/lib/routes.ts`) | un layout racine propre (`<html lang="fr">`, sans Tailwind ni Geist) |
| Préfixe de route | `BASE` dans `lib/routes.ts`, chemins publics en dur dans `content/extraits.ts` (généré), `ui/photo.tsx`, `styles/g2g.css`, `store/lecteur-store.ts` (Media Session), `scripts/g2g-lib.ts` | `BASE = ''` et dossier `public/` à la racine |
| Polices locales | chemins relatifs de `next/font/local` dans `layout.tsx` | ajuster le chemin |
| Dépendances et config | `package.json` (`gsap`, `lenis`, `sharp` transitif, `tsx`, script `test:g2g-tokens`), `eslint.config.mjs`, `tsconfig.json` (alias `@/*`) | déclarer un `package.json` propre ; aucune dépendance à Prisma, three ou R3F |
| Variables | `G2G_URL_SITE` ; `DATABASE_URL` n'est jamais lue | poser `G2G_URL_SITE` sur le nouveau projet |
| Restent côté portfolio | `src/lib/accents.ts`, `prisma/seed.ts`, `scripts/g2g-upsert-projet.ts`, `scripts/g2g-capture-home.ts`, la tuile | la tuile pointe alors vers le domaine du label (`liveUrl`) |

4. **Brief v1.6** (le numéro v1.5 était déjà pris par le bloc 6.1) : statut, accord du label, extractibilité (§6), exception SEO reformulée (§8), blocs 7.0 et 7.1 et Phase 7 (§9), definition of done, questions ouvertes (domaine, autonomie éditoriale).

## Bloc 7.1 — tuile dans le portfolio

1. **Tuile.** `scripts/generate-g2g-tuile.ts` relancé : SVG identique (le bloc 7.0 n'a rien changé de ce qu'elle montre). Accent `'groove-to-grave': '#F14442'` présent dans `src/lib/accents.ts`.
2. **Fusion.** `tsc`, lint, build de production, `npm run test:guard` et `npm run test:g2g-tokens` propres sur la branche ; aucun commit de `main` manquant. PR #5 ouverte par l'API GitHub (`gh` n'est pas installé) : https://github.com/julienrobert17/portfolio/pull/5, 42 commits, état `clean`, fusionnée par merge commit `139b88b`. Déploiement de production `portfolio-io019pyq3` prêt en 51 s. Vérifié : les onze pages de `/experience/groove-to-grave` en 200, `noindex, nofollow` présent, canonical, `/experience/la-coupe` 200, home `/` 200, `/games/geodatle` 200, polices sous-ensemblées servies. `/projects` répond 404, comme avant la fusion (seul `projects/[slug]` existe sur `main`) : hors périmètre.
3. **Écriture en base**, une seule, avec le `.env` du dépôt principal (base Neon de production), par `scripts/g2g-upsert-projet.ts --ecrire` (pas de `prisma db seed`). Avant : 9 lignes dans `Project`, aucun slug ni titre en conflit, catégorie de la-coupe `perso` reprise, ligne affichée. Après : 10 lignes, aucune autre ligne modifiée (`updatedAt` identiques), aucune disparue. Ligne écrite : `id cmv3mcnln0000b279mc923npj`, slug `groove-to-grave`, titre « Groove To Grave Records », tags musique, label, audio, WebGL, Next.js, `liveUrl /experience/groove-to-grave`, `imageUrl /experience/groove-to-grave/tuile.svg`, `featured true`, `category perso`, `publishedAt 2026-10-11`. `prisma/seed.ts` aligné sur la même ligne. **Retour arrière** (retire cette seule ligne, rien d'autre) :

```
cd /Users/julienr/Desktop/portfolio && set -a && source .env && set +a && npx tsx scripts/g2g-upsert-projet.ts --supprimer
```

4. **Tuile en production.** La home est pré-rendue au build (`○ /`, cache `HIT`) : la ligne n'est apparue qu'après un redéploiement de production depuis le même déploiement de `main` (`vercel redeploy`, `portfolio-36kg83930`, prêt en 2 min, pas de nouvelle fusion). À retenir : toute modification de `Project` demande un redéploiement (ou une revalidation de la home). `scripts/g2g-capture-home.ts` (Chrome headless) : panneau des projets ouvert par « Découvrir mes projets », tuile trouvée en première position du filtre « Personnels » avec `tuile.svg` en fond et `--card-accent: #F14442`, survol puis clic sur « Voir le projet → » : `location.pathname` devient `/experience/groove-to-grave`, à 1440 et à 390 px. Captures : `docs/groove-to-grave/planches/phase-7.1/` (`home-1440.jpg`, `tuile-1440.jpg`, `home-390.jpg`, `tuile-390.jpg`, résultats JSON).

## Phase 7, étape 1 — audit pour l'autonomie du label

Rien n'est installé, rien n'est écrit, aucun compte créé. Faits relevés le 11 octobre 2026 sur les pages officielles (tarifs, documentation, registre npm) ; les incertitudes sont listées en fin de section. Besoin : 2 à 4 éditeurs non techniques, environ 50 sorties, 200 soirées, 2 Go de médias, site Next 16.2.6 sur Vercel, contenu aujourd'hui en TypeScript typé.

### Contraintes communes (Vercel, GitHub)

- Fonctions Vercel : 300 s et 2 Go en Hobby, 800 s en Pro ; corps de requête serveur 4,5 Mo ; Cron Hobby une exécution par jour ; Vercel Blob Hobby 1 Go et 10 Go de transfert par mois.
- GitHub : fichier de 100 Mio au plus, dépôt recommandé sous 1 Go ; Actions 2 000 min/mois gratuites (dépôt privé), 6 h par job.
- Conséquence : 2 Go de médias ne tiennent dans aucun dépôt Git ; toute option « contenu dans Git » impose un stockage externe pour les fichiers.

### Tableau comparatif

| Critère | Sanity (Free) | Keystatic + Cloud | Payload v3 (auto-hébergé) | TinaCMS + TinaCloud |
|---|---|---|---|---|
| Connexion des éditeurs | e-mail + mot de passe, Google ou GitHub ; 20 sièges en Free, mais 2 rôles seulement (Administrator, Viewer) : tout éditeur est admin | sans GitHub avec Cloud (mot de passe, passkey) ; 3 utilisateurs en Free, pas de rôles | e-mail + mot de passe natif, rôles par code, utilisateurs illimités | e-mail ; 2 utilisateurs en Free, rôles Admin et Editor |
| Interface, téléphone | Studio conçu pour mobile (documenté) | non documenté | non documenté | non documenté |
| Brouillon, aperçu, programmation | brouillons natifs, Visual Editing et `draftMode` en Free ; programmation en Growth seulement | pas de brouillons natifs (branches Git), aperçu par recette Draft Mode | brouillons, autosave, versions, Live Preview ; programmation exige un runner de jobs (Cron Hobby : 1 fois/jour) | brouillons par champ ou branches ; workflow éditorial à partir de Team Plus (41 $) |
| Modèles et validations | `required`, `custom((valeur, contexte))` avec accès au document (requis conditionnel), références, tableaux | `isRequired` ; champ `conditional` ; pas de fonction de validation custom documentée ; `relationship` par slug non mis à jour | `required`, `validate(valeur, { data, siblingData })`, `admin.condition`, relations, tableaux | `required`, `ui.validate` avec les autres champs, absent sur `reference`, `object`, `rich-text` |
| Médias | 100 Go de stockage et 100 Go/mois de bande passante inclus ; 100 Mo par requête d'upload ; webhooks sur les assets | fichiers dans le dépôt (limites GitHub) ; Cloud Images (Pro) images < 5 Mo, pas d'audio | aucun stockage fourni : Vercel Blob (1 Go Hobby) ou S3/R2 ; hooks d'upload ; sharp intégré | dans le dépôt via le CDN Tina, 100 Mio par fichier, pas de hook |
| Où tourne notre pipeline (ffmpeg, sharp, couleurs) | webhook → Route Handler Vercel (300 s) ou GitHub Action (ffmpeg système, 6 h) ; Sanity Functions (Node 24, jusqu'à 900 s) non documentées pour ffmpeg | GitHub Action sur push (le commit déclenche aussi un build complet) | hook `afterChange` dans la fonction Vercel du site (300 s, `/tmp` 500 Mo) ou GitHub Action | GitHub Action sur push |
| Publication | webhook GROQ (secondes) → `revalidateTag` ; `next-sanity` déclare Next 16 ; mise en ligne en secondes, sans rebuild | commit → build Vercel complet (minutes) | hook direct → `revalidateTag`, immédiat | commit → build complet ; webhooks TinaCloud possibles |
| Coût pour 4 éditeurs, 50 sorties, 200 soirées, 2 Go | **0 €** : Free = 20 sièges, 10 000 documents, 250 000 requêtes API et 1 M CDN/mois, 100 Go d'assets ; Growth 15 $/siège/mois (60 $) seulement pour les rôles fins et la programmation | 15 $/mois (Pro 10 $ + 5 $ par utilisateur au-delà de 3) ; médias hors Git à payer ailleurs | logiciel 0 € ; 2 Go > Blob Hobby → Vercel Pro 20 $/mois ou R2 ; Payload Cloud en pause (nouveaux projets fermés) | Team 24 $/projet/mois (3 utilisateurs) + 90 $/an par siège ; médias hors Git à payer ailleurs |
| Portabilité | contenu dans le Content Lake, export `sanity dataset export` (ndjson + assets) ; Studio hébergé à part (`*.sanity.studio`) ou embarqué ; portfolio ou projet séparé, indifférent ; rien dans la base Prisma | YAML/JSON/Markdoc dans Git ; aucune dépendance hébergeur (Cloud = auth) | Postgres à soi (Neon : base séparée à créer) ; export CSV/JSON par plugin ; admin dans la même application Next (`withPayload` dans `next.config` du portfolio tant que le site y reste) | Markdown/JSON dans Git ; TinaCloud pour l'auth et l'API |
| Performance (bundle public) | 0 JS CMS avec lecture serveur ; `SanityLive` et `VisualEditing` optionnels, petits, côté client | 0 JS CMS, admin en route `use client` isolée | 0 JS CMS, admin isolé dans un route group | `useTina` ajoute du JS sur les pages en édition visuelle ; 0 sinon |
| Compatibilité Next 16 / React 19 | déclarée : `next-sanity@13.3.4` (peer `next ^16`, `react ^19.2`), `sanity@6.18.0` | `@keystatic/next@5.0.5` peer `next >=14` ; bug ouvert #1549 (admin blanc sous Next 16) | doc « Next 16.2.6+ », mais peer npm `>=16.3.3` → monter Next ; `payload@3.90.2` | non déclarée ; usage en 16.2.x rapporté ; `tinacms@3.14.2` |
| Effort de migration | moyen : schémas, import ndjson depuis le TypeScript, requêtes GROQ serveur, webhook, pipeline | faible pour le contenu (fichiers), mais médias et brouillons à bricoler | élevé : Payload embarqué dans le portfolio, nouvelle base, Next à monter, stockage à payer | moyen, mais limites Free trop basses |

### Recommandation : Sanity, offre Free, Studio hébergé à part

- **Éditeurs** : connexion par e-mail et mot de passe sans compte GitHub, Studio utilisable sur téléphone, 2 à 4 personnes sans frais. La seule concession : en Free, tout éditeur est Administrator (ce que 2 à 4 personnes de confiance d'un label supportent) ; les rôles fins coûteraient 60 $/mois.
- **Modèles et règles** : nos règles passent telles quelles en validations Sanity (crédits obligatoires, `alt` obligatoire sur chaque image, extrait accepté seulement si la piste est sortie, un extrait par piste), avec références entre sortie, artiste et soirée.
- **Médias** : le label dépose ses fichiers bruts dans le Studio (100 Go inclus, 100 Mo par fichier). Pipeline : un webhook Sanity sur les documents dont un fichier brut change déclenche un `repository_dispatch` GitHub ; une Action exécute `g2g-media.ts` avec le ffmpeg et le sharp du runner, réutilise `g2g-lib.ts` (`encoderMp3Normalise` : extrait de 60 s à −14 LUFS avec fondus, refus si la piste n'est pas sortie ; `exporterImage` : AVIF et WebP sans recadrage) et `g2g-couleurs.ts` (dominante, accent, contrastes), puis téléverse les dérivés dans Sanity et patche le document (extrait, couleurs, contrastes vérifiés) par `@sanity/client`. Rien n'est commité, aucun rebuild, zéro dépendance nouvelle côté site ; environ 1 à 2 minutes par fichier, 2 000 minutes gratuites par mois. Variante si l'on préfère tout garder dans Vercel : Route Handler avec `ffmpeg-static` (300 s, binaire d'environ 75 Mo sous la limite de 250 Mo), au prix d'une dépendance.
- **Publication** : webhook de publication vers `/api/g2g/revalidation` qui appelle `revalidateTag` ; les pages gardent leur rendu serveur et leur cache ; mise en ligne en quelques secondes. Aperçu : `draftMode` et Presentation (Visual Editing) inclus en Free.
- **Portabilité** : le Studio est déployé sur `*.sanity.studio` (ou un dossier `studio/` avec son propre `package.json`), donc rien du Studio n'entre dans le portfolio ; le site ne dépend que de `next-sanity` côté serveur ; export complet en ndjson et assets à tout moment ; fonctionne que le site reste sous le portfolio ou parte sur son propre projet Vercel ; aucune écriture dans la base Prisma.
- **Performance** : lecture serveur par `sanityFetch`, zéro JavaScript du CMS dans le bundle public ; Lighthouse inchangé tant que l'on n'embarque pas `SanityLive` sur les pages publiques (on ne l'embarque pas).
- **Point d'attention** : les extraits seraient servis depuis `cdn.sanity.io`, donc hors origine. L'analyseur Web Audio exige `crossOrigin="anonymous"` sur l'élément audio (le CDN Sanity envoie les en-têtes CORS) ; sinon, une réécriture `next.config` vers le CDN garde la même origine. À vérifier en Phase 7.4 sur Safari.

Pourquoi pas les autres : Keystatic et Tina mettent le contenu dans Git, ce qui est élégant, mais 2 Go de médias ne tiennent pas dans un dépôt, chaque publication rebuild tout (minutes, pas secondes), Keystatic a un bug ouvert sous Next 16 et Tina limite le Free à 2 utilisateurs. Payload est le plus puissant mais s'embarque dans l'application Next elle-même (`withPayload` sur le `next.config` du portfolio tant que le site y reste), réclame une base Postgres à part, un stockage payant pour 2 Go et une montée de Next ; son offre cloud est fermée aux nouveaux projets.

### Plan de migration en phases (après décision)

1. **7.2 Schémas et import** (aucune dépendance dans le portfolio) : projet Sanity Free et dataset `production` ; dossier `studio/` avec son propre `package.json` ; schémas `sortie` (pistes, extraits, pochette avec `alt` et crédit obligatoires, crédits, statut, genres, liens), `artiste`, `soiree` (flyer, date, lieu, line-up, billetterie, statut annulée ou reportée), `textes`, `reglages` (contact, newsletter) ; validations de nos règles ; `scripts/g2g-export-sanity.ts` qui transforme `content/*.ts` en ndjson et téléverse les originaux de `content/groove-to-grave/media/source/` ; import par `sanity dataset import`. Preuve : les 7 sorties, 19 artistes et 17 soirées lus dans le Studio.
2. **7.3 Lecture par le site** : `next-sanity` ; requêtes GROQ serveur avec tags de cache ; types générés (`sanity typegen`) pour remplacer `content/types.ts` ; `couleurs.ts`, `medias.ts` et `extraits.ts` générés deviennent des champs des documents ; les pages gardent leur rendu serveur ; `g2g-verif.ts`, `g2g-a11y.ts` et Lighthouse inchangés.
3. **7.4 Pipeline médias** : webhook Sanity → `repository_dispatch` → Action GitHub qui lance `g2g-media.ts` (adapté pour lire depuis Sanity et écrire dans Sanity, `g2g-lib.ts` et `g2g-couleurs.ts` réutilisés), patch des documents ; `crossOrigin` ou réécriture pour l'audio ; mesures de niveau avec les vrais extraits.
4. **7.5 Publication et aperçu** : webhook de publication → `revalidateTag` ; `draftMode` et Presentation ; comptes des éditeurs par e-mail ; guide d'une page pour le label ; formation d'une heure.
5. **7.6 Audits et exploitation** : Lighthouse sur la preview (critère inchangé), axe-core, clavier ; export mensuel du dataset en sauvegarde ; retrait du contenu TypeScript devenu inutile.

### Dépendances à valider (aucune installée)

- Dans le portfolio (phase 7.3) : `next-sanity@13.3.4` (apporte `@sanity/client`) ; rien d'autre. `@sanity/image-url` n'est pas nécessaire : nos AVIF et WebP restent produits par le pipeline.
- Dans `studio/` (projet séparé, hors bundle du site) : `sanity@6.18.0`, `react`, `react-dom`, `styled-components`, `@sanity/vision`.
- Pipeline en Action GitHub : `@sanity/client` (déjà via `next-sanity`), ffmpeg et sharp du runner ; variante Route Handler : `ffmpeg-static`.
- Secrets : jeton Sanity en écriture pour l'Action et le Route Handler de revalidation, secret de webhook ; `G2G_URL_SITE`.

### Incertitudes non tranchées

- Sanity : faisabilité de ffmpeg dans Sanity Functions (non documentée, d'où le choix de l'Action GitHub) ; fichiers de plus de 100 Mo à l'upload ; nombre de webhooks par plan.
- Payload : écart entre la doc (Next 16.2.6+) et le peer npm (`>=16.3.3`).
- Keystatic : résolution du bug #1549 ; limite « < 5 Mo » de Cloud Images lue hors de la page dédiée.
- Tous : utilisation sur téléphone non documentée hors Sanity.

## Reste

- Décision sur l'outil ; puis 7.2.
- Domaine final, `G2G_URL_SITE`, retrait du `noindex`.
- Fichiers du label : logos, extraits, textes validés.
