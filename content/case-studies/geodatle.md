# Geodatle

> Un jeu de géographie quotidien : un pays mystère, huit tentatives, et des indices tirés de vraies données plutôt que d'un dictionnaire.

**Stack** : Next.js · TypeScript · Our World in Data · REST Countries · react-simple-maps
**Durée** : 4 semaines, puis des retouches chaque semaine
**Rôle** : conception, données, développement, FR/EN

---

## Le point de départ

Les clones de Wordle sur la géographie demandent de deviner un pays à partir de sa forme ou de son drapeau. J'en ai fait une dizaine, ils se ressemblent tous et on les oublie en deux jours.

Ce qui m'intéressait, c'était d'apprendre quelque chose à chaque tentative. Pas « le pays est plus au nord », mais « le pays a une population plus grande, un PIB par habitant plus faible, une espérance de vie proche ». Devine le pays avec des indices qui sont des faits, et à la fin tu as appris cinq choses sur un endroit du monde.

Un pays par jour, le même pour tout le monde, pour que les gens en parlent.

## Ce que j'ai décidé, et ce que ça a coûté

**Des données réelles plutôt qu'un fichier écrit à la main.**
Our World in Data pour les indicateurs (population, PIB, espérance de vie, émissions), REST Countries pour les métadonnées (continent, capitale, drapeau, voisins). Les données sont vraies, datées, et je peux ajouter un indicateur sans rien saisir. Le coût : deux sources qui ne parlent pas le même langage, et un script de fusion qui a pris plus de temps que le jeu lui-même.

**Le pays du jour calculé, pas stocké.**
Un seed dérivé de la date, un générateur pseudo-aléatoire déterministe, et tout le monde a le même pays sans base de données ni serveur d'état. Le coût : impossible de choisir le pays d'un jour précis sans modifier le seed, et si la liste des pays change, tout l'historique se décale. J'ai figé la liste.

**La partie sauvegardée en localStorage, pas de compte.**
Pas d'inscription, pas de serveur, la partie du jour survit au rechargement. Le coût : pas de statistiques entre appareils, et un peu de code de synchronisation avec le rendu serveur pour éviter les erreurs d'hydratation.

## Le problème qui m'a bloqué

**Le symptôme.** Une vingtaine de pays avaient des indicateurs vides ou absurdes. La Namibie avait une population de zéro. La Côte d'Ivoire n'existait pas. Le Congo était deux pays différents selon la source, et aucun des deux ne correspondait.

**Ma première hypothèse, qui était fausse.** J'ai cru à des données manquantes chez Our World in Data et j'ai commencé à écrire des valeurs de remplacement à la main. Après dix pays, j'ai arrêté : si je dois saisir à la main, autant ne pas avoir de source.

**Ce que j'ai vraiment trouvé.** Les deux sources n'utilisent pas les mêmes codes pays. REST Countries donne des codes ISO alpha-3, OWID a ses propres entités avec des libellés en anglais et des codes parfois absents. « Côte d'Ivoire » était « Cote d'Ivoire » d'un côté et « Ivory Coast » de l'autre. La Namibie avait un code ISO alpha-2 « NA », que mon parseur CSV transformait en valeur nulle.

**La solution.** Un script de génération, exécuté une fois, qui construit un fichier de pays unique à partir des deux sources avec une table de correspondance explicite pour les cas ambigus, et qui échoue bruyamment dès qu'un pays n'a pas de correspondance. Plus de fusion à la volée. Le jeu lit un seul fichier propre, et le script me dit exactement ce qui manque quand je mets les données à jour.

## Les détails qui ont demandé plus de temps que prévu

- **Le CSV d'Our World in Data pèse 2,9 Mo.** Trop lourd pour être servi au client, et au-dessus de la limite du cache de données de Next. Il est lu côté serveur et seuls les indicateurs utiles sont extraits dans le fichier généré, qui fait 80 Ko.
- **La carte.** Afficher le pays deviné et le pays mystère sur une carte monde aurait donné la réponse. La carte ne montre que les pays déjà proposés, colorés selon leur distance au pays mystère, ce qui est un indice sans être une réponse.
- **FR/EN.** Le jeu est bilingue, mais les noms de pays aussi, et un joueur français qui tape « Allemagne » doit être compris. Chaque pays a ses noms dans les deux langues plus les variantes courantes.

## Résultat

- 195 pays, 6 indicateurs par pays, données de 2022 et 2023
- Fichier de données servi au client : 80 Ko, contre 2,9 Mo à la source
- Partie moyenne résolue en 5 tentatives
- Une poignée de joueurs quotidiens qui m'envoient leur score sans que je le demande

[Voir le projet →](/games/geodatle)
[Le code sur GitHub →](#)

## Ce que je referais autrement

Je figerais le format des données avant d'écrire une ligne d'interface. J'ai construit l'interface sur des données que je croyais propres, et chaque correction de données cassait un écran.

Je mettrais le mode debug dès le premier jour. Tester le jeu en attendant minuit pour avoir un nouveau pays, je l'ai fait trop longtemps.
