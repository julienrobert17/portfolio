# Groove To Grave — compte-rendu du bloc 7.5b (le CDN rétabli, le piège du cache nommé et fermé)

12 octobre 2026 · branche `experience/groove-to-grave` · commit `3f20441` · preview https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app

## 1. Ce que tes essais sur iPhone établissent

| Essai | Résultat | Ce qu'il élimine |
|---|---|---|
| F — CDN + Web Audio + `crossOrigin` | **joue** (5,12 s) | ni Web Audio, ni `crossOrigin`, ni le CDN |
| G — F + `preload="none"` | **joue** (5,12 s) | ni le préchargement |
| H — même origine, cache amorcé | **cale** · `stalled`, réseau 2, prêt 0 | — |
| H2 — même origine, tel quel | **cale** · idem | — |
| I — même origine, tampon décodé | **joue** · 45 s décodées, analyseur 190 | le réseau et le fichier sont sains, même par notre domaine |
| J — CDN, tampon décodé | **joue** · analyseur 190 | — |
| K — reproduction fidèle du lecteur, CDN | **joue** (5,15 s, analyseur 255) | **ni l'élément créé hors geste, ni la chaîne complète de nœuds, ni le souffle, ni le ralenti** |

K est le verdict : **le lecteur, tel qu'il est écrit, joue sur ton iPhone dès lors que le fichier vient du CDN.** La livraison par notre domaine est la seule chose qui cale.

## 2. La cause du blocage en même origine, établie

Le cache de périphérie de Vercel garde la **première** réponse d'une adresse. Or la première requête d'iOS sur un média n'est pas le fichier : c'est une sonde `Range: bytes=0-1`. Sur une adresse neuve, trois requêtes suffisent à le voir :

```
1. Range: bytes=0-1   → 206 · content-range 0-1/1081512 · 2 octets · cache MISS
2. requête complète   → 206 · content-range 0-1/1081512 · 2 octets · cache HIT
3. Range: 0-200000    → 206 · content-range 0-1/1081512 · 2 octets · cache HIT
```

L'élément reçoit deux octets, jamais le flux : `networkState 2`, `readyState 0`, `stalled` à +3 s, **aucune erreur**. C'est mot pour mot ton relevé de D, E, H et H2.

**Et voilà pourquoi la preview jouait quand même sur ton iPhone** : ses adresses étaient déjà en cache **complet** (mes requêtes entières et les passages de Chrome les avaient remplies). Vérifié ce soir sur les sept MP3 que sert vraiment sa page sorties : `200`, 1 081 512 octets. Sur une adresse déjà pleine, les plages sont ensuite servies correctement :

```
adresse réelle de la page : Range 0-1 → 206, 2 octets (HIT) · puis complète → 200, 1 081 512 octets (HIT)
```

**Réponse nette à ta question 7 : oui, le bon fonctionnement de la preview dépendait de qui avait demandé le fichier en premier. Ce n'était pas livrable.** Une nouvelle sortie, dont le premier auditeur serait sur iPhone, aurait été muette pour tout le monde jusqu'à l'expiration de l'entrée. Et mes essais H et H2, qui ajoutaient un paramètre unique à l'adresse pour « ne pas mesurer le cache », mesuraient en réalité **exactement** le pire cas : adresse neuve, première requête de plage. Les deux observations ne se contredisent pas, elles décrivent les deux bouts du même défaut.

## 3. Ce qui est corrigé

1. **Le CDN redevient la livraison par défaut** (`G2G_MEDIAS_MEME_ORIGINE` est de nouveau une option à poser, plus un comportement). Les pages de la preview ne contiennent plus une seule adresse de notre domaine pour les médias.
2. **Le piège du cache est fermé**, pour que l'option même origine existe le jour du domaine du label. La réécriture Next ne pouvait pas le faire : **les en-têtes de la destination externe l'emportent sur `headers()`** (vérifié : la réponse gardait `public, max-age=31536000` du CDN). Elle est remplacée par une route, `src/app/experience/groove-to-grave/media/[fichier]`, qui relaie le CDN et décide elle-même du cache : **réponse partielle → `Cache-Control: no-store`** (jamais mémorisée), **réponse complète → `public, max-age=31536000, immutable`**. Seuls les noms de fichiers de Sanity (empreintes hexadécimales) passent. C'est un fichier dans `src/app/`, que tu demandes d'ordinaire à valider : je l'ai créé parce que ta consigne 2 demandait précisément d'agir sur la route de réécriture, et qu'aucun autre endroit ne permet de maîtriser ces en-têtes.

   **Preuve sur la preview, adresse neuve, les trois mêmes requêtes :**
   ```
   1. Range: bytes=0-1  → 206 · no-store · 2 octets · MISS      (la sonde n'est plus mémorisée)
   2. requête complète  → 200 · public, immutable · 1 081 512 octets · MISS
   3. requête complète  → 200 · public, immutable · 1 081 512 octets · HIT
   ```
3. **Repli documenté, non implémenté** : la lecture par tampon décodé (`fetch` + `decodeAudioData` + `AudioBufferSourceNode`), que tes essais I et J valident sur iPhone des deux origines, est consignée dans le brief avec ses coûts (téléchargement complet avant lecture, perte de la lecture progressive). K prouve qu'on n'en a pas besoin.

Brief mis à jour des trois points, plus la règle de livraison : le CDN par défaut, l'option même origine seulement après un essai sur appareil.

## 4. Ce que sert la production, et pourquoi je cesse de m'en servir de référence

Déploiement en ligne : `portfolio-nyjt9lfd8`, du 12 octobre 15 h 14 — mon redéploiement manuel de `main` pour la variable d'environnement du relais. Commit **`5f59fee`**, c'est-à-dire la fusion de la PR #11, **bloc 7.4b**. Vérifié par trois marqueurs plutôt que par l'historique seul : la route `/api/g2g/medias` répond (401 sans signature) → 7.4b présent ; le préchargement LCP est dans la page → 7.4b présent ; l'en-tête `Link` précharge encore VT323 → **7.4c absent** ; aucune trace de l'état d'échec → **7.5a absent**. Ta production est donc à deux blocs derrière, ce qui explique qu'aucun message n'apparaisse après trois secondes.

À 14 h 45, elle servait le même commit (le déploiement de 14 h 15, automatique à la fusion de la PR #11). Ses quatorze adresses audio pointent sur le CDN ; je les ai toutes interrogées comme le ferait un iPhone : **206 avec `access-control-allow-origin` pour l'origine de production**, les fichiers existent, la liste CORS de Sanity contient bien `https://portfolio-eight-sable-66.vercel.app` et l'adresse n'a pas changé depuis. Autrement dit : **rien, dans ce que je peux observer aujourd'hui, n'explique le silence de 14 h 45** — et comme tu le dis, le build testé n'est pas celui qu'on veut valider. Je le note et je passe, comme demandé.

## 5. À toi : le vrai site, sur ton iPhone

Preview, médias servis par le CDN (la configuration validée par F, G et K) :
**`https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app/experience/groove-to-grave/sorties`**

1. Appuie sur le bouton rond d'une cassette : le morceau démarre-t-il, le compteur avance-t-il, le spectre bouge-t-il ?
2. Si rien ne vient, attends trois secondes : « EXTRAIT INDISPONIBLE · BANDCAMP » doit s'afficher dans la barre du bas, le souffle doit se taire.
3. Si ça joue : va sur « artistes », reviens — le son doit continuer.
4. Verrouille, déverrouille : pause propre.

C'est ce test qui vaut validation. **Aucune fusion d'ici là.** En local : g2g-verif 160/160, g2g-a11y 42/42, tokens 19 paires, `tsc`, lint et build propres.
