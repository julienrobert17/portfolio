# Groove To Grave — compte-rendu de Phase 1 (contenu et médias)

10 octobre 2026 · branche `experience/groove-to-grave` · worktree `.claude/worktrees/groove-to-grave`

## Fait

- Brief passé en v1.1 (commit `5018a00`) : liste des changements en tête, onze arbitrages de Phase 0 intégrés, nouvelle section §7 « Médias fournis par le label », sections renumérotées, questions 3 et 4 résolues (GTGR01 existe, crédits de GTGR04).
- Contenu typé sous `src/components/experience/groove-to-grave/content/` : `types.ts`, `releases.ts` (7 sorties, 37 pistes avec durées), `artists.ts` (3 membres du crew, 4 artistes signés, 12 invités), `events.ts` (17 soirées dont 1 à venir), `label.ts` (identité, réseaux, disquaires, textes `draft`), `index.ts` (filtres de presets, extraits attachés aux pistes), plus `couleurs.ts`, `medias.ts` et `extraits.ts` générés. Chaque entrée porte `sources` et `verified` ; tout texte de notre main porte `draft: true`.
- `content/groove-to-grave/` : `sources.md` (pages consultées, ce qui reste à vérifier), `sources.json` (URL, page, date, dimensions de chaque média récupéré), `media/label/` (README des conventions, `manifest.json` vide et valide, `.gitignore`), `media/source/` (originaux publics, hors dépôt), `media/provisoires.json`, `media/rapport.md`.
- Scripts : `g2g-lib.ts` (chemins, export AVIF et WebP repris du bloc de `fetch-la-coupe-photos.ts` sans recadrage ni rendu, WAV, ffmpeg, contrastes), `g2g-fetch-media.ts`, `g2g-couleurs.ts`, `g2g-extraits.ts`, `g2g-media.ts`, `g2g-planche-da.ts`.
- Planche « relevé DA » : `docs/groove-to-grave/planches/releve-da-2026-10-10.jpg` (2400 × 4966), 7 pochettes avec pastilles de couleurs, 13 visuels de soirées sur 17, liste des manques.
- Correction après relecture : GTGR01 typé `ep-numerique`, champ `format` sur chaque sortie (« 12″ vinyle », « EP numérique », « compilation numérique »), mur trié série GTGR du plus récent au plus ancien puis compilations, brief §3.4 et §4 mis à jour.
- Huit commits par bloc après le brief, `tsc`, lint et build propres, branche poussée sur origin.

## Arbitrages

- Les originaux publics de `media/source/` sont exclus de git comme ceux du label : 22 Mo de pochettes en pleine résolution n'ont pas leur place dans le dépôt, et `g2g-fetch-media.ts` les retélécharge à l'identique depuis `sources.json`.
- Les pochettes Bandcamp des vinyles sont les étiquettes rondes sur fond noir : l'extraction de couleurs lit dans le disque inscrit (rayon 48 %), sinon la dominante était le fond noir pour quatre sorties sur sept. Chaque couleur porte son contraste avec `ink` et avec `poster` pour choisir la couleur du texte de l'étiquette.
- Les quatre soirées sans source lisible restent dans le contenu en `verified: false`, dont la date annulée du 1er novembre 2024 dont rien ne subsiste en ligne.
- Les textes de soirées sont repris à leur premier paragraphe, langue d'origine, y compris leur vocabulaire nautique qui est celui du label, pas le nôtre.
- Les scripts ont un `main()` asynchrone : le dépôt compile en CommonJS, sans top-level await.
- Les extraits provisoires sont attribués à la première piste de chaque sortie (A1 des vinyles, piste 1 des compilations).

## Résultats

- Catalogue : GTGR01 *Common Speed EP* (LukasDarian, EP numérique, 22 juillet 2022, artwork Cbrgraphics, mastering Marine Benabou) ; GTGR02 et GTGR04 épuisés, GTGR03 et GTGR05 en stock, tous en pressage limité sans repress ; GTGR04 daté du 21 mars 2025, artwork JeunePenard, piste bonus numérique. Les sept pochettes récupérées en originaux (3000 à 5670 px).
- Soirées : quatre dates nouvelles (Panic Room le 10 mai 2023, Denyl Brook au 42 Marches le 2 mars 2024, Burnin' Ship 2 et 3 à la Péniche Cinéma les 13 avril et 28 juin 2024), Danza To The Grave datée au 31 octobre 2025 à la Péniche Marcounet, et une date à venir : Finesse Rekords x Groove To Grave au rooftop Plantation le 11 octobre 2026, entrée libre. L'état vide de la page soirées ne sera donc pas l'état réel au lancement.
- Visuels : 13 flyers sur 17, crédits LukasDarian lus sur cinq d'entre eux. Shotgun bloque les robots (429) et Resident Advisor le HTML (403) : les flyers viennent des captures Wayback Machine et de l'API GraphQL de RA.
- Médias : 20 images en six largeurs AVIF et WebP (7,5 Mo), 7 extraits provisoires de 45 s (7,2 Mo, crête à −5,6 dB), rapport par emplacement (0 label, 20 public, 7 provisoire, 30 absents).
- Couleurs : dominante et accent par sortie, par exemple GTGR01 `#009ee2` et `#e84d1a`, GTGR03 `#a64943` et `#f1d8ad`, GTGR05 `#041527` et `#535c79`.
- Outils : sharp 0.34.5 transitif, ffmpeg 8.0.1 Homebrew, aucune dépendance ajoutée, pas de Playwright.

## Reste

- Passe d'identité du directeur artistique sur la planche : logo, palette, typographies, puis mise à jour des tokens. Phase 2 bloquée en attendant.
- À valider par le label : genres des presets, les quatre dates non vérifiées (22 février 2023, 4 novembre 2023, 1er novembre 2024, 7 février 2025), l'alias J. Fuego, le rôle de Pink Mermaids et de Fritzy, le mastering de GTGR02 lisible sur l'étiquette, l'adresse de contact et de démos.
- Textes `draft` de `label.ts` (phrase, pourquoi, démo, état vide, newsletter, mention concept) à faire valider.
- Les originaux de `media/source/` sont à retélécharger sur toute nouvelle copie du dépôt avant de relancer `g2g-couleurs.ts`, `g2g-media.ts` ou `g2g-planche-da.ts`.
