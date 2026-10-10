# Sources — Groove To Grave Records

Relevé du 10 octobre 2026 pour le site concept `groove-to-grave`. Chaque entrée du contenu typé
(`src/components/experience/groove-to-grave/content/`) porte ses URL dans `sources` et un
drapeau `verified`. Ce fichier liste les pages consultées, ce qu'elles donnent, et tout ce qui
reste non vérifié. Instagram n'a jamais été consulté.

## Pages consultées

| Source | URL | Ce qu'elle donne |
|---|---|---|
| Bandcamp, page du label | https://groovetograve.bandcamp.com/music | liste des 7 références, bio « Paris based record label », liens Instagram, SoundCloud, Linktree |
| Bandcamp, chaque sortie | `https://groovetograve.bandcamp.com/album/<slug>` | titres, durées, date de sortie, crédits (`Cat. number`, artwork, mastering, distribution, A&R), texte de sortie, mots-clés, disponibilité du vinyle (« Limited copies / No repress », épuisé ou en stock), image originale (`f4.bcbits.com/img/a<id>_0.jpg`) |
| Linktree | https://linktr.ee/groovetograve | liens du label et prochaine soirée (Finesse Rekords x Groove To Grave, Plantation, 11/10) |
| Ville de Paris | https://www.paris.fr/evenements/groove-to-grave-records-a-la-peniche-marcounet-65178 | soirée du 13 juillet 2024 (Péniche Marcounet, 14 quai de l'Hôtel-de-Ville, 23 h à 5 h, gratuit), texte de présentation du collectif en français, visuel public |
| Yoyaku | https://www.yoyaku.io/release/gtgr02/ · https://yoyaku.io/artist/azbine/ · https://yoyaku.io/release/emi-omar-homo-musicus-ep-gtgr04/ | GTGR02 et GTGR04 (format, genres, tracklist), bio Azbine (« duo Matis & Théo from Lyon, created in 2018 ») |
| deejay.de | https://www.deejay.de/Groove_To_Grave_Records__L297054 | GTGR03 et GTGR05 en stock, dates boutique (22/02/2024 et 19/05/2026, différentes des dates Bandcamp) |
| Subwax | https://subwax.es/brands/groove-to-grave-records/ | GTGR02 à GTGR05, disponibilité (02 et 04 épuisés) |
| Redeye | https://www.redeyerecords.co.uk/vinyl/192460-gtgr05-merov-interdimensional-groove-ep | GTGR05, tracklist |
| Soirées | voir le tableau ci-dessous | |

## Sorties

| Ref | Date (Bandcamp) | Format | Statut | Crédits | Notes |
|---|---|---|---|---|---|
| GTGR01 | 2022-07-22 | numérique | — | artwork Cbrgraphics, mastering Marine Benabou (MB Mastering) | existe bien ; sans texte de sortie ; pas de vinyle |
| GTGR02 | 2023-07-07 | 12″ | épuisé, no repress | artwork JeunePenard, distribution Subwax | l'étiquette du disque mentionne un mastering (Octavix Studio ?), illisible avec certitude : à vérifier |
| GTGR03 | 2024-05-24 | 12″ | en stock, no repress | artwork JeunePenard, mastering Benoit D. (Perception Mastering), distribution Subwax | deejay.de date la sortie boutique du 22/02/2024 |
| GTGR04 | 2025-03-21 | 12″ | épuisé, no repress | artwork JeunePenard, mastering Benoit D., distribution Subwax | piste bonus numérique « Lucky Good » ; l'étiquette mentionne « Written & Mixed by … » : à relever |
| GTGR05 | 2026-05-13 | 12″ | en stock, no repress | artwork JeunePenard, mastering Benoit D., distribution Subwax | deejay.de : 19/05/2026 ; Redeye : épuisé chez eux |
| GTGRVA01 | 2025-07-04 | numérique | — | artwork LukasDarian, mastering Gregs, A&R Jules Fritsch | |
| GTGRVA02 | 2026-07-17 | numérique | — | artwork LukasDarian, mastering Gregs, A&R Jules Fritsch | |

Genres des presets : déduits des mots-clés Bandcamp et des textes (`genresVerified: false`), à
valider par le label. Prix : non stockés. Les « New & Notable » Bandcamp cités dans le brief v1
pour Summer Hits Vol.1 n'ont pas été retrouvés sur une page lisible : non repris.

## Artistes

- Crew : rôles lus dans les crédits des compilations (A&R Jules Fritsch, artwork LukasDarian,
  mastering Gregs) et dans le texte de la Ville de Paris (« Julius, LukasDarian et Gregs »).
  L'alias « J. Fuego » et la composition passée du crew (Fritzy, Pink Mermaids) n'ont aucune
  source lisible : non repris.
- Azbine (Lyon, duo, 2018), Kitchen Plug (trio parisien), Emi Ömar, Merov' : présentations
  reprises mot pour mot des textes Bandcamp (anglais). Ville inconnue pour Emi Ömar et Merov'.
- Invités des compilations et Karaba (remix) : nom et piste seulement.
- SoundCloud et Resident Advisor refusent les requêtes automatisées : pas de bio supplémentaire.

## Soirées

Voir `events.ts` et la section suivante, complétée après la relève des pages de billetterie.

### Relevé des soirées (10 octobre 2026)

Shotgun refuse les requêtes automatisées (« Vercel Security Checkpoint », HTTP 429) ; les pages ont été
lues par leurs captures Wayback Machine (JSON-LD `MusicEvent`, `og:image`) ou en direct quand une
tentative passait. Resident Advisor refuse le HTML (403) mais répond par son API GraphQL. Les
visuels de soirées sont les images de couverture publiques des pages de billetterie.

| Date | Nom / lieu | Source lisible | Vérifié |
|---|---|---|---|
| 2026-10-11 | Finesse Rekords x Groove To Grave, Plantation Paris | Shotgun en direct, RA 2544127, Linktree | oui |
| 2026-01-09 | Groove To Grave Extended, 42 Marches | Wayback Shotgun, RA 2326038 (RA donne 23 h à 6 h, Shotgun minuit à 14 h) | oui |
| 2025-12-19 | Midnight Express, Le Wagon Bleu | page organisateur Shotgun (date, lieu) ; horaires, prix, texte non trouvés | oui |
| 2025-10-31 | Danza To The Grave, Péniche Marcounet | Wayback Shotgun | oui |
| 2025-07-25 | Open air Jardin21 | jardin21.fr ; billetterie bam-ticket.com disparue (DNS) | oui |
| 2025-04-19 | Vinyle Village, Rotonde Stalingrad | Wayback Shotgun, wander-app.fr | oui |
| 2025-02-07 | Emi Ömar b2b Gregs, Alyhas, Pink Mermaids | aucune (listings RA du jour sans trace) | **non** |
| 2024-11-01 | 42 Marches, annulée | aucune (ni Shotgun, ni RA, ni Wayback) | **non** |
| 2024-08-31 | Attrape Rave, Rotonde Stalingrad | Wayback Shotgun | oui |
| 2024-07-13 | Péniche Marcounet | paris.fr, Wayback Shotgun | oui |
| 2024-06-28 | Burnin' Ship 3, Péniche Cinéma | Wayback Shotgun | oui, nouvelle |
| 2024-04-13 | Burnin' Ship 2, Péniche Cinéma | Wayback Shotgun | oui, nouvelle |
| 2024-03-02 | How I Met : Denyl Brook, Amex Live Bar (42 Marches) | Wayback Shotgun | oui, nouvelle |
| 2023-11-04 | Burnin' Ship, Péniche Cinéma | aucune ; existence déduite du texte de Burnin' Ship 2 | **non** |
| 2023-05-10 | Panic Room | Wayback Shotgun | oui, nouvelle |
| 2023-02-22 | Bar éphémère L'Exode | aucune ; un extrait de recherche dit le 23 février ; expo Hannah Uzan non confirmée | **non** |
| 2023-01-07 | Liebe, première soirée | Shotgun en direct | oui |

À faire valider par le label : les quatre dates non vérifiées, l'alias « J. Fuego » (line-up de la
Panic Room, « les deux fondateurs du label LukasDarian & J. Fuego »), le statut de Pink Mermaids et
Fritzy dans le crew (Pink Mermaids est présenté en 2023 comme l'alias du duo LukasDarian et
J. Fuego, puis en 2026 comme résident avec Gregs). La page organisateur Shotgun liste aussi comme
artistes passés : Emi Ömar, H3 Records, Denyl Brook, Alyhas, Venetia, Peaktime Records
(ex-Itinérairebis), Kitchen Plug, Mely, Blinkduus Dischetto, Mimso, Casual Plaza, Lungo.

## Visuels

`sources.json` (généré) donne l'URL d'origine, la page, la date et les dimensions de chaque
pochette et de chaque visuel récupéré ; les quatre soirées sans source n'ont pas de visuel. Les
originaux restent hors dépôt (`media/source/.gitignore`), relancer `scripts/g2g-fetch-media.ts`
les retélécharge.
