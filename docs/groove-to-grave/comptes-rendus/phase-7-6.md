# Groove To Grave — compte-rendu de la Phase 7.6 (guide, durée, brouillons)

13 octobre 2026 · branche `experience/groove-to-grave`, commit `efe59a5` · Studio redéployé · preview https://portfolio-git-experience-groov-35f191-juliens-projects-6a16cb9e.vercel.app

## Fait

**A. Guide du label** (`docs/groove-to-grave/guide-label.md`, seule version, lue telle quelle par le Studio). Les délais annoncés sont ceux que nous avons mesurés : un texte publié apparaît le plus souvent en moins d'une minute, parfois deux ou trois ; un extrait demande une à deux minutes de traitement en plus ; la règle des dix minutes est conservée. La réversibilité est dite exactement, et à ses deux endroits : tout ce qui est **écrit** se récupère depuis l'historique du document, un **fichier remplacé** — pochette, flyer, extrait — ne revient pas, donc on garde son original (la demi-phrase est aussi au moment du remplacement d'un extrait). Trois sections nouvelles : **Première connexion** (invitation, compte avec l'adresse invitée, favori, rien à installer, et la liste `a-completer-par-le-label.md` comme première tâche), **Ajouter ou corriger un artiste** (champs, ordre d'affichage, et l'explication de la case « à valider par le label », vers laquelle les autres sections renvoient), **Les images à déposer** (fichier d'origine le plus grand, au moins 1600 px, jamais recadré ni retouché, avec la raison : un petit fichier donne une pochette floue partout et c'est irrattrapable). La ligne sur Vision est retirée ; l'avertissement sur l'onglet Automatique, l'adresse de page et les champs Sources reste. Une ligne de contact en fin de guide, portant en clair **« adresse à compléter avant envoi »**.

**B. Durée des pistes.** Le stockage ne change pas — des secondes — mais la saisie est humaine : `studio/composants/duree.tsx` accepte `3:42`, `3'42`, `1:02:30` et `222`, affiche sous le champ ce qui a été compris (`3:42 — 222 secondes enregistrées`) et refuse en français ce qu'il ne sait pas lire. Le champ s'appelle maintenant « Durée ». Dix formes d'entrée et quatre de sortie ont été passées en revue (dont `3:62` et `0`, refusées). Types regénérés (`sanity schema extract` + `typegen`, aucun changement dans `types.generated.ts` : seuls le libellé et le composant ont bougé), `sanity documents validate` sur le dataset : **45 documents valides, 0 erreur, 0 avertissement**. Les **37 durées des 7 sorties ont été relevées avant et après, à l'identique** — aucune écriture en base.

**C. Textes en brouillon.** `G2G_MASQUER_BROUILLONS=1` fait qu'un texte non validé n'est pas publié du tout. Les cinq textes du label concernés (phrase d'accroche, pourquoi, démo, soirées vides, newsletter) et les trois présentations d'artistes (Gregs, Julius, LukasDarian) ont été neutralisés à la lecture, et les pages capturées en 1440 et 390, pleine hauteur, après animations.

## Arbitrages

- **Une section qui perd son texte s'en va avec son titre** (« Pourquoi », sur la page label) ; **une section dont les liens valent par eux-mêmes les garde** (« Proposer une démo » conserve son titre et ses deux boutons). La phrase d'accueil et le titre de l'état « aucune soirée annoncée » s'effacent simplement, le texte explicatif qui suit porte déjà le sens.
- **Le message de la newsletter ne peut pas disparaître** : il dit un fait (rien n'est enregistré). Sans le texte du label, le site le dit de sa propre voix, en une phrase factuelle.
- **Le pied de page ne parle plus de brouillons** quand il n'y en a plus à l'écran.
- **Les mentions « brouillon » étaient écrites en dur** dans le JSX de trois pages : elles seraient restées après validation par le label. Elles sont désormais conditionnées au champ.
- **Contrôle ajouté à `g2g-verif`** : « aucun titre orphelin ni section vide », sur chaque page et chaque format — il couvre les deux états (brouillons affichés ou masqués) et tout champ vidé par le label. Le composant de saisie, lui, vit dans le Studio : `g2g-verif` ne le voit pas, il est couvert par les dix formes d'entrée vérifiées et par `documents validate`.

## Résultats

- Planches : `planches/phase-7.6-sans-brouillons/` et `phase-7.6-avec-brouillons/`, dix images chacune — page label, page artistes, et les trois pages d'artistes concernées, en 1440 et 390. Le détecteur automatique (titre dont la section n'a plus rien, section visible vide) ne relève **rien dans les deux états**. La page label perd 338 px en 1440 et 474 px en 390, ce qui est exactement la section « Pourquoi » ; les pages d'artistes perdent la seule présentation.
- `tsc`, lint, build : propres. Tokens 19 paires. `g2g-a11y` 42/42.
- **`g2g-verif` : 182/182 en local et 182/182 sur la preview** (154 + 2 × 2 pour l'extrait indisponible au bloc 7.5a, + 2 × 11 pour le nouveau contrôle de creux).
- Brief : la décision de direction sur les brouillons et la règle de saisie des durées y sont consignées.

## Reste

- **g2g-verif contre la production après fusion** : je l'ai lancé jusqu'à la preview, la production attend ton accord — rien n'a été fusionné.
- La ligne de contact du guide, à remplir avant envoi.
- Les invitations : aucune créée, la marche à suivre est dans le compte-rendu de la Phase 7.5.
