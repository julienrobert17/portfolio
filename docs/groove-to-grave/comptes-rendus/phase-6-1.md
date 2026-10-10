# Groove To Grave — compte-rendu du bloc 6.1 (LCP mobile, polices)

11 octobre 2026 · branche `experience/groove-to-grave` · commits `33145ef` (code), `HASH_DOCS` (captures, rapports, compte-rendu) · preview Vercel : https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app/experience/groove-to-grave · ni seed, ni écriture en base, ni fusion.

## Fait

1. **Polices sous-ensemblées, auto-hébergées.** fontTools 4.66 et brotli installés par pip dans un environnement Python hors dépôt (`~/.cache/g2g-polices-venv`), rien d'autre. `scripts/g2g-polices.ts` télécharge les fichiers latins de Google Fonts (Archivo variable `wdth,wght`, Permanent Marker, VT323) dans le cache hors dépôt, dérive le jeu de caractères du contenu typé et de l'interface de l'expérience (tout caractère imprimable des fichiers `content/`, `ui/`, `layout/`, `sections/` et des pages, tracés SVG exclus, plus l'ASCII, le français, la ponctuation typographique, ″ · Ö : 158 caractères, `polices/jeu.txt`), restreint Archivo aux plages réellement utilisées (`fontTools.varLib.instancer`, wdth 75 à 100, wght 400 à 900 ; la police reste variable dans ces plages) et sous-ensemble les trois polices (`layout_features = ['*']` : chiffres tabulaires `tnum` et crénage conservés, hinting retiré). Résultat dans `src/components/experience/groove-to-grave/polices/`, servi par `next/font/local` : Archivo seule préchargée, Permanent Marker et VT323 en `swap` sans préchargement.

| Police | Avant (Google Fonts, latin) | Après | Glyphes | Axes |
|---|---|---|---|---|
| Archivo variable | 88 kB (préchargée) | 42 kB (préchargée) | 196 | wght 400..900, wdth 75..100 |
| Permanent Marker | 29 kB | 22 kB | 154 | |
| VT323 | 7 kB | 5 kB | 163 | |
| **Avant le LCP** | **124 kB** | **69 kB** (objectif 70) | | |

2. **Rendu inchangé, prouvé.** `scripts/g2g-captures-polices.ts` capture le premier écran de l'accueil, de `/sorties` et de `/sorties/gtgr05` à 1440 et à 390 px avant et après (canvas retiré pour comparer le même fond), puis compare les pixels :

| Page | Format | Écart moyen (0 à 255) | Pixels mobiles (> 24 niveaux) |
|---|---|---|---|
| accueil | 1440 | 0,36 | 0,51 % |
| sorties | 1440 | 0,26 | 0,36 % |
| sortie-gtgr05 | 1440 | 0,41 | 0,56 % |
| accueil | 390 | 0,24 | 0,37 % |
| sorties | 390 | 0,11 | 0,16 % |
| sortie-gtgr05 | 390 | 0,13 | 0,17 % |

Les écarts résiduels sont l'anticrénelage (hinting retiré) ; captures dans `docs/groove-to-grave/planches/phase-6.1/` (`avant-*`, `apres-*`).

3. **Mesure de référence sur la preview Vercel** (`scripts/g2g-lighthouse.ts --formats mobile --passages 5`, mobile simulé, quatre pages, l'un après l'autre, médiane par la performance ; rapports HTML dans `docs/groove-to-grave/lighthouse/phase-6-1/`). Avant = Phase 6 (polices Google), après = bloc 6.1.

Après (bloc 6.1, polices sous-ensemblées, 69 kB avant le LCP) :

| Format | Page | Perf | Access. | Bonnes pratiques | SEO | LCP | CLS | TBT | JS | Médiane (5 perf) |
|---|---|---|---|---|---|---|---|---|---|---|
| mobile | accueil | 99 | 100 | 100 | 66 | 2,11 s | 0,000 | 4 ms | 208 kB | ok (87/99/99/99/93) |
| mobile | sorties | 95 | 100 | 100 | 63 | 2,90 s | 0,000 | 2 ms | 209 kB | ok (98/95/98/95/94) |
| mobile | sortie-gtgr05 | 98 | 100 | 100 | 66 | 2,41 s | 0,000 | 10 ms | 208 kB | ok (93/98/97/98/99) |
| mobile | soirees | 95 | 100 | 100 | 66 | 2,89 s | 0,000 | 9 ms | 207 kB | ok (88/98/94/98/95) |

Avant (Phase 6, polices Google Fonts, 124 kB) : sur la preview, seul l'accueil avait été mesuré, en trois passages, 86/96/96 (médiane 96, LCP 2,8 s, FCP 1,2 s) ; les trois autres pages n'ont pas de mesure « avant » sur la preview (voir la mesure locale ci-dessous pour la comparaison page par page). Critère : 95 au moins en performance sur les quatre pages, atteint (95, 95, 98, 99) ; accessibilité et bonnes pratiques 100 ; SEO 63-66, exception assumée du `noindex`. CLS 0, TBT ≤ 10 ms, LCP simulé 2,1 à 2,9 s.

Mesure locale indicative (build de production local, HTTP/1.1, trois passages, médiane ; rapports dans `lighthouse/phase-6-1-local/`) :

| Page | Perf avant (Phase 6) | LCP avant | Perf après | LCP après | Polices avant → après |
|---|---|---|---|---|---|
| accueil | 93 | 3,15 s | 94 | 3,08 s | 124 → 70 kB |
| sorties | 92 | 3,30 s | 94 | 2,99 s | 124 → 70 kB |
| sortie-gtgr05 | 91 | 3,38 s | 92 | 3,37 s | 124 → 70 kB |
| soirees | 91 | 3,53 s | 92 | 3,38 s | 124 → 48 kB |

4. **SEO** : le `noindex` reste jusqu'à l'accord du label ; consigné au brief §8 comme exception assumée du critère, avec la ligne à retirer le jour de la mise en ligne (`robots: { index: false, follow: false },` dans `src/app/experience/groove-to-grave/layout.tsx`). `g2g-lighthouse.ts` n'exige plus 95 sur le SEO.
5. **Ni seed, ni écriture en base, ni fusion.** `scripts/g2g-upsert-projet.ts` (upsert de la seule entrée `groove-to-grave`, non exécuté) remplace la commande de seed dans le brief §9 ; la tuile, l'accent et l'entrée de `seed.ts` restent préparés ; la fusion sur `main` attend l'accord écrit du label (brief §9, §10). Brief v1.5.

## Arbitrages

- **Hinting retiré** des sous-ensembles : les navigateurs modernes n'en tiennent pas compte sur macOS et iOS, et c'est ce qui explique les 0,1 à 0,4 niveaux d'écart moyen.
- **Archivo reste variable** dans ses plages plutôt qu'instanciée en graisses fixes : une seule requête, mêmes interpolations qu'avant (600, 700, 800, 900 et les largeurs 75, 80 et 100 %).
- **Permanent Marker et VT323 restent en `swap`** et demandées par le CSS au premier rendu (étiquettes et afficheur sont dans le premier écran) ; elles comptent dans les 69 kB.
- **Mesure locale** : HTTP/1.1 et gzip du serveur local pénalisent le modèle ; la preview (HTTP/2, Brotli, CDN) est la référence, comme demandé.

## Résultats

- Preview Vercel, mobile simulé, médiane de cinq passages : accueil 99, sorties 95, sortie GTGR05 98, soirées 95 ; accessibilité et bonnes pratiques 100. Critère atteint.
- Polices avant le LCP : 124 → 69 kB ; rendu identique (écart moyen < 0,5 niveau).

## Reste

- Décisions du label : accord écrit, puis `noindex` retiré, seed ou upsert, fusion.
- VoiceOver, planches finales, Safari macOS et iPhone, par le directeur artistique.
