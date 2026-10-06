# Portfolio IA

> Un portfolio dont les fiches projet sont rédigées par un modèle de langage à partir des dépôts, relues par un humain, et stockées comme n'importe quelle donnée.

**Stack** : Next.js 14 · TypeScript · Prisma · PostgreSQL · API d'un modèle de langage
**Durée** : 2 semaines pour la première version, puis itérations
**Rôle** : conception, données, développement

---

## Le point de départ

Écrire la fiche d'un projet est la partie que tout développeur repousse. Le code est là, le README aussi, mais transformer ça en trois paragraphes lisibles par quelqu'un qui n'a pas ouvert le dépôt, c'est un travail de rédaction que personne ne fait.

L'idée : donner le README, la liste des fichiers et les messages de commit à un modèle, lui demander une première version de la fiche, et ne garder que l'étape de relecture. Le modèle écrit le brouillon, je corrige.

Ce n'était pas un projet sur l'IA. C'était un projet sur le fait d'avoir enfin des fiches à jour.

## Ce que j'ai décidé, et ce que ça a coûté

**Prisma et PostgreSQL plutôt que des fichiers markdown.**
Les fiches générées sont des données : elles ont une date, une version, un statut (brouillon, relu, publié). Les mettre en base permet de régénérer, comparer, et garder l'historique. Le coût : une base à héberger et à migrer pour un site qui aurait pu tenir dans un dossier de fichiers.

**Le modèle n'écrit jamais directement en ligne.**
Chaque génération crée un brouillon que je dois valider à la main. Rien ne part en production sans relecture. Le coût : le flux n'est pas automatique, mais c'était le but. Un portfolio avec une erreur factuelle générée par un modèle est pire qu'un portfolio vide.

**Un prompt par type de contenu, versionné dans le code.**
Un prompt pour le résumé court, un pour la description longue, un pour la liste des technologies. Chaque prompt est un fichier, avec son historique git. Le coût : plus de prompts à maintenir, mais quand une génération déçoit, je sais lequel corriger.

## Le problème qui m'a bloqué

**Le symptôme.** Les fiches générées étaient fluides, bien écrites, et fausses une fois sur trois. Le modèle attribuait au projet des fonctionnalités qui n'existaient pas, citait des librairies absentes du `package.json`, et inventait des chiffres de performance.

**Ma première hypothèse, qui était fausse.** J'ai cru que le prompt n'était pas assez strict. J'ai ajouté des instructions : « ne mentionne que ce qui est dans le README », « n'invente pas de chiffres ». Ça a réduit le problème sans le régler, et les fiches sont devenues plus plates.

**Ce que j'ai vraiment trouvé.** Le modèle n'avait pas assez de contexte réel pour remplir le format que je lui demandais. Je demandais trois paragraphes à partir d'un README de cinq lignes. Il comblait le vide avec du vraisemblable. Le problème n'était pas la consigne, c'était l'écart entre l'entrée et la sortie attendue.

**La solution.** Donner plus de matière et demander moins. Le contexte inclut désormais le `package.json`, l'arborescence, les dix derniers messages de commit, et le modèle produit une liste de faits sourcés (chaque fait cite le fichier d'origine) avant de rédiger. Si un paragraphe ne peut pas s'appuyer sur un fait de la liste, il reste vide, et c'est à moi de l'écrire. Le taux d'erreur factuelle est passé sous ce que je détecte à la relecture.

## Les détails qui ont demandé plus de temps que prévu

- **Le coût des appels.** Régénérer toutes les fiches à chaque ajustement de prompt coûtait quelques euros à chaque fois. J'ai ajouté un cache par hash du contexte : même entrée, même prompt, pas d'appel.
- **La relecture.** Une interface d'administration minimale, brouillon à gauche, version publiée à droite, un bouton pour valider. Plus de temps que prévu parce que c'est l'écran que j'utilise le plus.
- **Le ton.** Les premières fiches sonnaient comme un communiqué de presse. J'ai fini par donner au modèle trois fiches écrites par moi comme exemples, et le ton s'est aligné.

## Résultat

- 12 projets documentés, dont 8 qui n'avaient jamais eu de fiche
- Temps par fiche : 5 minutes de relecture contre 45 minutes de rédaction
- Taux de correction à la relecture : une phrase sur dix environ
- Le mécanisme de faits sourcés est devenu la partie du projet dont je suis le plus content, et il n'était pas prévu

[Voir le projet →](/)
[Le code sur GitHub →](#)

## Ce que je referais autrement

Je commencerais par l'étape « faits sourcés » et je ne demanderais la rédaction qu'après. J'ai fait l'inverse, et toutes les premières semaines ont été passées à corriger de la prose au lieu de corriger des données.

Je mesurerais le taux d'erreur dès le début. Je l'ai estimé à l'œil pendant trop longtemps.
