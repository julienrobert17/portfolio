# Prototaxites

> Une expérience WebGL de trois minutes qui fait remonter le visiteur 420 millions d'années en arrière, à l'époque où le plus grand organisme terrestre n'était ni un arbre ni un animal.

**Stack** : Next.js · TypeScript · Three.js · React Three Fiber · Drei · GLSL
**Durée** : 5 semaines, en parallèle d'autres projets
**Rôle** : conception, 3D, développement, son

---

## Le point de départ

Au Dévonien, bien avant les premiers arbres, la terre ferme était dominée par des colonnes de huit mètres de haut dont personne ne sait vraiment ce qu'elles étaient. Les paléontologues ont mis plus d'un siècle à décider s'il s'agissait d'algues, de lichens ou de champignons. Aujourd'hui, l'hypothèse dominante reste le champignon géant.

Ce qui m'a accroché, c'est l'absence totale d'image mentale. On sait tous à quoi ressemble un dinosaure. Personne ne visualise un paysage où les plantes font dix centimètres et où ce qui dépasse, ce sont des champignons de la taille d'un immeuble de deux étages.

Je voulais fabriquer cette image. Pas une illustration, une scène dans laquelle on se déplace.

## Ce que j'ai décidé, et ce que ça a coûté

**React Three Fiber plutôt que Three.js vanilla.**
L'expérience est narrative : on avance par étapes, chaque étape change la scène et le texte. Je voulais piloter ça depuis le state React plutôt que gérer une machine à états parallèle en JavaScript pur. Le coût : une couche d'abstraction supplémentaire à comprendre quand les performances décrochent, et quelques soirées à démêler ce qui venait de React, de R3F ou de Three.

**Une scène unique plutôt que plusieurs scènes.**
Plutôt que de charger une scène par étape, tout vit dans un seul graphe et la caméra se déplace. Ça supprime les temps de chargement entre les étapes et permet des transitions continues. En échange, tout est chargé en mémoire dès le départ, ce qui m'a forcé à être strict sur le poids des assets.

**Pas de modèle 3D téléchargé pour les Prototaxites.**
Les reconstructions disponibles sont rares et souvent approximatives. J'ai généré les colonnes procéduralement à partir d'un cylindre déformé par du bruit, avec un shader custom pour la texture striée que montrent les fossiles. Plus de contrôle, et une scène qui ne ressemble pas à un asset store. Le coût : deux semaines sur le shader au lieu de deux heures sur un import.

## Le problème qui m'a bloqué

**Le symptôme.** Sur desktop, 60 fps stables. Sur mon téléphone, entre 18 et 25 fps dès que la caméra entrait dans la zone dense de végétation, avec des chutes à 10 fps pendant les transitions.

**Ma première hypothèse, qui était fausse.** J'ai immédiatement accusé les textures. J'avais des maps en 2048×2048 un peu partout. J'ai passé une soirée à tout compresser en KTX2 avec Basis Universal, à mipmapper, à réduire en 1024. Résultat : le temps de chargement a baissé de moitié, le framerate n'a pas bougé d'un fps.

**Ce que j'ai vraiment trouvé.** En ouvrant Spector.js, le nombre de draw calls était à plus de 1 400 sur une frame dense. La végétation basse — des centaines de petites plantes dispersées au sol — était rendue avec un `<mesh>` par instance dans une boucle `.map()`. Chaque plante était un appel de rendu séparé. Le GPU mobile ne tenait pas le rythme, et les textures n'avaient rien à voir là-dedans.

**La solution.** Passage en `InstancedMesh` : une seule géométrie, une seule matière, 600 instances positionnées par une matrice chacune. Les draw calls sont tombés à moins de 40. Retour à 55-60 fps sur mobile.

Deux ajustements derrière :
- Un **frustum culling manuel** sur les groupes d'instances, parce que `InstancedMesh` est culé comme un seul objet : si un seul brin est visible, toute la grille est rendue.
- Un **niveau de détail** sur les colonnes de Prototaxites. Au-delà de 40 unités de la caméra, le shader passe en version simplifiée sans bruit de déplacement.

**Ce que j'en retiens.** Mesurer avant d'optimiser. J'ai perdu une soirée parce que j'avais une intuition convaincante et pas de profiler ouvert.

## Les détails qui ont demandé plus de temps que prévu

- **Le son.** Un seul bruit de vent en boucle sonnait faux. J'ai superposé trois couches à des vitesses différentes avec une modulation lente du volume, et ajouté un filtre passe-bas qui s'ouvre quand la caméra monte. Ça a pris une journée pour quelque chose que la plupart des visiteurs ne remarqueront pas consciemment.
- **Le brouillard.** Le `fog` natif de Three est linéaire et plat. J'ai écrit un brouillard volumétrique approximatif dans le shader de sol, plus dense près du sol, pour donner l'impression d'une atmosphère humide et chargée en CO₂, cohérente avec le Dévonien.
- **Le premier chargement.** 11 Mo au départ. J'ai découpé les assets par étape avec `useLoader` et `Suspense`, préchargé l'étape suivante en arrière-plan, et compressé les géométries en Draco. Premier affichage sous les 2 secondes en 4G.

## Résultat

- 55-60 fps sur mobile milieu de gamme, 60 fps sur desktop
- 38 draw calls par frame en moyenne, contre 1 400 au départ
- Premier rendu en 1,8 s sur une connexion 4G simulée
- Poids total des assets : 4,2 Mo, dont 3,1 Mo chargés à la demande

[Voir l'expérience →](/experience/prototaxites)
[Le code sur GitHub →](#)

## Ce que je referais autrement

Je commencerais par le téléphone. J'ai construit toute la scène sur desktop puis j'ai essayé de la faire tenir sur mobile après coup, ce qui est le sens inverse de ce qu'il faut faire pour une expérience grand public.

Je mettrais le profiler en place dès le premier commit, pas après le premier problème.

Et je garderais une liste des idées que j'ai écartées. Il y avait une version où le visiteur pouvait planter une spore et regarder un Prototaxites pousser en accéléré. Elle est restée dans un fichier `ideas.md` que j'ai oublié de relire jusqu'à la fin du projet.
