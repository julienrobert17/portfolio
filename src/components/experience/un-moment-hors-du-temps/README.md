# Un moment hors du temps

Un formulaire d'invitation à un date, en 8 écrans, où chaque champ cache un gag.
Blague affectueuse : elle doit rire, jamais se sentir piégée.

**Route** : `/experience/un-moment-hors-du-temps` — la page est en `robots: noindex`.
Le header du portfolio est déjà masqué sur `/experience/*` (`conditional-header.tsx`).

## Lancer en local

```bash
npm run dev
```

Puis http://localhost:3000/experience/un-moment-hors-du-temps

## Personnaliser les textes

**Tout est dans `content.ts`. Aucun texte n'est écrit en dur dans un composant.**

- `PERSO` — prénoms, surnoms, nom et photo du chat, trajet, numéro WhatsApp,
  créneaux disponibles, heure recommandée.
- `PROGRESS` — les 8 paliers de la barre de progression (elle ment, c'est le gag)
  et leurs commentaires.
- `COPY` — les textes écran par écran : `step0` … `step7`, plus `refused`.
  Les tableaux (`noLabels`, `reasons`, `clauses`, `suggestions`, `captchaTiles`)
  s'allongent ou se raccourcissent librement.

### À remplir avant d'envoyer le lien

1. **`PERSO.chat.nom`** vaut `'Mimi'` (déduit du nom du dossier). Il apparaît
   dans 4 gags : CAPTCHA, bandeau du trajet, clauses des CGU, signature.
2. **La photo du chat** vit dans `public/experience/mimi/`. Trois fichiers :
   `chat.jpg` (l'original), `chat-tete.jpg` (carré recadré sur la tête, utilisé
   par les vignettes) et `chat-carte.jpg` (allégé, pour la carte du portfolio).
   Si le fichier manque, `ui/cat-photo.tsx` retombe sur un emoji : rien ne casse.
   Attention : l'original porte un tag EXIF de rotation, donc le navigateur le
   voit en portrait 2160x3840 alors que `sips` le lit en 3840x2160.
3. Vérifier **`PERSO.creneauxOffsets`** — des décalages en jours *à partir
   d'aujourd'hui*, exprès : le lien ne périme jamais.

## Les 8 écrans

| # | Écran | Mécanique |
|---|-------|-----------|
| 0 | Enveloppe | ouverture au tap, confettis, faux bandeau cookies |
| 1 | Identité | prénom qui se réécrit seul, CAPTCHA dont tout est valide, case auto-cochée |
| 2 | LA question | le « Non » fuit le curseur, puis se pose au bout de 7 esquives |
| 3 | La date | calendrier hostile à excuses absurdes, 4 créneaux dorés, compte à rebours |
| 4 | L'heure | slider à zones commentées, aimant contournable sur 19:30 |
| 5 | L'activité | 5 cartes dont une qui se décoche seule, autocomplétion absurde |
| 6 | Les modalités | 2 sliders truqués, CGU signées par le chat |
| 7 | Confirmation | envoi truqué, ticket, `.ics`, WhatsApp, recommencer |

## Ce qui n'est pas négociable dans le code

- **Le « Non » finit toujours par marcher.** Après 7 esquives il se pose et
  ouvre une modale sincère avec une vraie porte de sortie (`screen-refused.tsx`).
  Au clavier il est atteignable au Tab et activable à l'Entrée **dès le premier
  écran** : le moteur d'esquive n'écoute aucun événement clavier.
- **`prefers-reduced-motion`** coupe confettis, pluie d'emojis et transitions ;
  l'esquive devient un décalage instantané.
- **Aucun dark pattern** : les deux boutons du bandeau cookies font la même
  chose, aucun faux bouton de fermeture, aucun son.

## Architecture

```
content.ts               tous les textes et réglages          ← le seul fichier à éditer
use-invitation-machine   useReducer + sessionStorage + hash d'URL
use-dodge.ts             moteur d'esquive (ressort 170/18, clamp viewport)
use-reduced-motion.ts    useSyncExternalStore sur la media query
celebration-context.tsx  canvas + confettis + easter egg
use-konami.ts            Konami au clavier · 5 tapes rapides au doigt
confetti.ts / ics.ts     modules purs, sans dépendance
dates.ts / share.ts      helpers de date · récap, lien wa.me, n° de confirmation
ui/                      bouton, carte d'étape, barre de progression, modale accessible
steps/                   un fichier par écran
```

**État et navigation** — `sessionStorage['hors-du-temps']` pour le refresh, le
hash d'URL (`#/3`) pour le bouton retour du navigateur. L'écran final réécrit le
hash en `#/s/<état encodé en base64url>` : le lien est partageable et rejoue le
ticket, sans backend. Un verrou de 420 ms neutralise double-clics et spam.

**Zéro dépendance ajoutée** : ressort, confettis et `.ics` sont écrits à la main
(quelques dizaines de lignes chacun) plutôt que de tirer framer-motion,
canvas-confetti et `ics`.

## Easter egg

Code Konami au clavier (↑↑↓↓←→←→ B A), ou **5 tapes rapides sur la barre de
progression** au doigt → pluie d'emojis.
