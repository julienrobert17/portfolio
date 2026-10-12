# Groove To Grave — compte-rendu de la Phase 7.5 (clôture 7.5b et autonomie du label)

12 octobre 2026 · `main` à `d0141f4` (fusion de la PR #12) · production https://portfolio-eight-sable-66.vercel.app · Studio https://groove-to-grave.sanity.studio

## 1. Clôture : g2g-verif contre la production

La production sert bien le code fusionné, vérifié par marqueurs et non par l'historique : l'en-tête `Link` ne précharge plus VT323 (7.4c), le bundle contient l'état d'échec du lecteur (7.5a), les pages servent sept adresses du CDN et aucune de notre domaine (7.5b), et la route de relais renvoie `cache-control: no-store` sur une réponse partielle (7.5b).

**`npx tsx scripts/g2g-verif.ts --url https://portfolio-eight-sable-66.vercel.app` : 160/160.** Résultat complet en annexe `phase-7-5-g2g-verif-production.md`. Les quatre chemins d'arrivée aux deux formats (URL directe, tuile du portfolio, lien interne, retour et avance) : AudioContext `absent → running` au premier vrai clic, position qui avance, 32 colonnes du spectre qui changent, aucune erreur de console ; et le nouveau contrôle d'extrait indisponible passe aux deux formats.

## 2. Le silence du 14 h 45 : plus rien ne subsiste, sujet clos

Les quatorze adresses audio de la page sorties de production, interrogées comme le fait un iPhone (sonde `Range: bytes=0-1` puis fichier entier, avec l'`Origin` de la page) : **sept fichiers distincts, tous en 206 avec `access-control-allow-origin` sur la sonde, tous en 200 et 1 081 512 octets sur la requête complète.** L'origine de production figure dans la liste CORS de Sanity et n'a pas changé. Le build du moment (`5f59fee`, bloc 7.4b) n'avait ni l'état d'échec du lecteur ni les correctifs suivants : il ne pouvait rien afficher et n'a rien laissé. **Aucune cause ne subsiste.** Consigné dans le brief comme incident non expliqué sur un build antérieur, et clos. Ce qui en reste de concret : un silence du même genre parlerait désormais, grâce à l'état d'échec du bloc 7.5a.

## 3. Pipeline, mesure réelle en production

Dépôt d'un fichier audio sur une piste publiée, relais et Action allégée en production :

| Étape | Horodatage | Depuis le dépôt |
|---|---|---|
| Fichier déposé, document publié | 18:12:16,9 | — |
| Webhook reçu par `/api/g2g/medias` | 18:12:18,4 | **1,5 s** |
| `repository_dispatch` transmis à GitHub | 18:12:21,9 | 5,0 s |
| Exécution créée | 18:12:24 | 7,1 s |
| **Traitement terminé** (extrait découpé, normalisé, téléversé) | 18:13:09 | **52,2 s** |
| Webhook de revalidation (3,2 s de réponse) | 18:13:02 | 45,7 s |
| Page de production servant le nouvel extrait | 18:14:51 | **153,9 s** |

**Le chiffre réel est 153,9 s**, mais il faut le lire en deux parties. Ce qui dépend de nous — dépôt, relais, file d'attente, traitement — tient en **52 s** (contre 97 s pour la seule Action avant le bloc 7.4c). Le dernier saut, la propagation de la page revalidée jusqu'à la périphérie, a pris cette fois une centaine de secondes alors qu'il avait été mesuré à 3,6 s au bloc 7.4b : la revalidation est bien partie à l'heure (webhook à 18:13:02, réponse 200 en 3,2 s), c'est la page prérendue qui a continué d'être servie un moment. Je n'ai pas d'explication établie pour cet écart et je ne le présente pas comme une mesure stable.

À noter, conforme à ce qui était prévu : les patches du pipeline déclenchent eux-mêmes deux exécutions supplémentaires, qui sortent immédiatement (8 et 10 s) grâce à l'étape « quelque chose à traiter ? », et l'une d'elles est annulée par le groupe de concurrence.

## 4. Autonomie du label

### Le guide

`docs/groove-to-grave/guide-label.md` — une page, en français, écrite pour quelqu'un qui n'a jamais touché un CMS : ajouter une sortie, ajouter une soirée, déposer un extrait audio, ce que veulent dire les quatre états du traitement, et ce à quoi il ne faut pas toucher (l'onglet Automatique, l'adresse d'une page publiée, les sources, la suppression d'un document).

**Il est aussi dans le Studio**, section **Guide** en bas du menu : le composant lit le fichier Markdown du dépôt tel quel (`?raw`), il n'en existe donc **qu'une version** — corriger le fichier met le Studio à jour au prochain déploiement. Studio redéployé.

### Ce que le label doit compléter

`docs/groove-to-grave/a-completer-par-le-label.md`, relevé dans le contenu publié, avec pour chaque point l'endroit exact où agir :

1. **huit crédits de flyers** encore « auteur non identifié » (liste datée) ;
2. **les genres des sept sorties**, déduits des textes publics, jamais confirmés — ils commandent le filtre du mur et les presets ;
3. **quatre soirées** dont la date ou le lieu reste à confirmer (dont une sans lieu connu) ;
4. **les textes que nous avons écrits** : cinq textes du label et trois présentations d'artistes, marqués « brouillon » sur le site tant que la case n'est pas décochée ;
5. **les coordonnées** : aucune adresse de contact ni de démo, newsletter inactive — le site le dit honnêtement en attendant ;
6. **un crédit de mastering** lu sur une étiquette (GTGR02), à confirmer ;
7. sans être des corrections : **sept extraits encore provisoires**, **aucun portrait d'artiste**, et **les logos** qui restent nos tracés.

### Les invitations — marche à suivre, rien n'a été créé

Aucun compte n'a été créé, comme demandé. Quand tu me donnes les adresses, une commande par personne, depuis `studio/` :

```
npx sanity users invite adresse@exemple.fr --role editor
```

- **Rôle `editor`** : lit et écrit tout le contenu, publie, dépose des fichiers ; ne touche ni à la facturation, ni aux jetons, ni aux membres. C'est le rôle qu'il faut pour le label. (`contributor` ne peut écrire que des brouillons sans publier — utile seulement si tu veux relire avant chaque mise en ligne ; `viewer` est en lecture seule.)
- La personne reçoit un courriel de Sanity, crée son compte (Google, GitHub ou courriel), et arrive directement sur **groove-to-grave.sanity.studio**. Rien à installer.
- **Sièges** : le plan Free en compte 20, trois sont pris par des jetons de robot (lecture du site, sauvegarde, pipeline) et un par toi. Il reste largement de quoi inviter l'équipe.
- Les membres se listent avec `npx sanity users list`, et se retirent depuis le tableau de bord Sanity.
- À leur envoyer en même temps : le guide (`guide-label.md`) et la liste à compléter (`a-completer-par-le-label.md`).

## 5. Reste

- Les adresses des éditeurs, quand tu veux : j'envoie les invitations.
- Le domaine final du label : ce jour-là, `G2G_URL_SITE`, retrait du `noindex`, ajout de l'origine dans la liste CORS de Sanity, et décision sur l'option « même origine » (route de relais prête, à vérifier sur appareil avant de la reprendre).
- Les extraits provisoires et les portraits, dès que le label dépose des fichiers.
