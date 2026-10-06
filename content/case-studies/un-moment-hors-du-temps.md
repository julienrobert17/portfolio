# Un moment hors du temps

> Un formulaire d'invitation en huit écrans, où chaque champ cache un gag et une mécanique qu'on n'attendait pas d'un formulaire.

**Stack** : Next.js · TypeScript · CSS animations · Server Actions
**Durée** : 3 semaines, le soir
**Rôle** : conception, écriture, développement

---

## Le point de départ

Il fallait un formulaire pour collecter les réponses à une invitation. Nom, nombre de personnes, régime alimentaire, le genre de chose que tout le monde remplit en quarante secondes sans lire.

Je ne voulais pas d'un Google Form. Je voulais que remplir le formulaire soit déjà un moment de l'événement, pas une formalité avant. Que les invités en parlent entre eux avant même de venir.

La contrainte que je me suis fixée : chaque écran doit être un vrai champ qui collecte une vraie donnée, et chaque écran doit avoir une mécanique différente. Pas de gag gratuit qui ne sert à rien.

## Ce que j'ai décidé, et ce que ça a coûté

**Huit écrans, un seul champ par écran.**
Un formulaire classique montre tout d'un coup. Ici, un écran = une question = une surprise. Le visiteur ne peut pas anticiper, et chaque écran a la place de respirer. Le coût : la progression est linéaire, pas de retour en arrière libre, donc la validation de chaque champ doit être irréprochable avant de passer au suivant.

**Pas de librairie de formulaire.**
React Hook Form ou Formik supposent un formulaire qu'on voit en entier. Mes champs changent de forme, se déplacent, négocient. J'ai écrit un petit moteur d'étapes avec un état par écran et une validation custom par type de champ. Le coût : réinventer la gestion d'erreurs, et un bug de focus qui m'a pris une soirée.

**Server Action pour l'envoi, sans API route.**
Une seule mutation, un seul appel à la fin. Pas besoin d'un endpoint REST pour ça. Le coût : la gestion des erreurs réseau est moins lisible qu'avec un fetch explicite, j'ai dû ajouter un état de retry manuel.

## Le problème qui m'a bloqué

**Le symptôme.** L'écran 4, où le champ se déplace quand on approche le curseur, fonctionnait sur desktop et était inutilisable sur mobile : pas de curseur, donc pas de fuite, donc pas de gag, et surtout un champ qu'on ne pouvait pas toucher parce que la détection de proximité se déclenchait au premier contact.

**Ma première hypothèse, qui était fausse.** J'ai cru que c'était un problème de seuil de distance. J'ai passé une heure à ajuster les pixels avant de comprendre que le problème n'était pas numérique.

**Ce que j'ai vraiment trouvé.** La mécanique « le champ fuit le curseur » n'a aucun équivalent tactile. Ce n'est pas un bug, c'est un design qui ne se traduit pas. Il fallait un gag différent pour le même champ.

**La solution.** Sur tactile, le champ ne fuit plus, il tremble légèrement quand on le touche et un texte apparaît : « Vous êtes sûr ? ». Trois touches successives et il se laisse remplir. La donnée collectée est la même, la mécanique est adaptée au support. J'ai ensuite relu les sept autres écrans avec cette question : est-ce que ça marche au doigt ?

## Les détails qui ont demandé plus de temps que prévu

- **L'écran du chat.** Un chat qui valide ou refuse la réponse d'un regard. Les expressions sont trois images et un timing, mais trouver le timing qui fait rire plutôt que celui qui agace a pris une dizaine d'essais avec des cobayes.
- **La transition entre écrans.** Un fondu simple cassait le rythme. Chaque écran a maintenant sa propre sortie, cohérente avec son gag : le champ qui fuyait part en courant, celui qui tremblait s'effondre.
- **L'accessibilité.** Un formulaire qui joue avec l'attention est un cauchemar au lecteur d'écran. Chaque écran a une version sans mécanique, activée automatiquement si `prefers-reduced-motion` est actif, et tous les gags visuels ont une alternative textuelle.

## Résultat

- 8 écrans, 8 mécaniques différentes
- 100 % des réponses attendues reçues, sans relance
- Temps moyen de remplissage : 4 minutes, contre 40 secondes pour un formulaire standard, et personne ne s'en est plaint
- Un invité a rempli le formulaire trois fois « pour revoir le chat »

[Voir le projet →](/experience/un-moment-hors-du-temps)
[Le code sur GitHub →](#)

## Ce que je referais autrement

Je concevrais chaque gag sur mobile d'abord. Le support tactile est le cas difficile, le curseur est le cas facile, et j'ai fait l'inverse.

Je garderais une liste des mécaniques écartées. Il y en a eu une douzaine, certaines meilleures que celles retenues, et je ne les ai plus.
