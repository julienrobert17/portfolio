import type { Question } from '../types'

/**
 * La banque de questions. Trois actes : l'échauffement, les aveux, le fond.
 * Éditable sans toucher au code — voir le README pour ajouter une question.
 *
 * L'ORDRE DE CE FICHIER EST L'ORDRE DE JEU. `buildRun` ne le remanie jamais :
 * il retire des questions quand les perso réclament la place, il ne réordonne
 * pas. Déplacer une question ici, c'est la déplacer dans la partie.
 *
 * Règles d'écriture :
 * - Court. En portrait côte à côte, chaque moitié ne fait que ~190px de large.
 * - Deux mécaniques identiques ne doivent jamais se suivre, y compris de part
 *   et d'autre d'un changement d'acte.
 * - Pour « le-mot », les 12 mots doivent s'accorder avec ce qu'ils qualifient,
 *   et être épicènes quand ils qualifient une personne : la même grille est
 *   montrée aux deux.
 * - Rien qui puisse blesser plutôt que faire rire, posé en face de quelqu'un
 *   qu'on aime. C'est le seul filtre, il est strict.
 * - Aucune question sur le jeu lui-même. Une expérience qui demande ce qu'on
 *   pense d'elle arrête la conversation qu'elle essaie d'ouvrir.
 */

/** Acte 1 — l'échauffement. Léger, rapide, sans enjeu. On apprend à jouer. */
const ACTE_1: readonly Question[] = [
  {
    id: 'a1-1',
    texte: 'Là, tout de suite, tu es plutôt',
    mecanique: 'bascule',
    acte: 1,
    options: ['bien réveillé', 'en pilote automatique'],
  },
  {
    id: 'a1-2',
    texte: 'Ta semaine, elle a été',
    mecanique: 'curseur',
    acte: 1,
    options: ['une éponge à tout', 'imperméable à tout'],
  },
  {
    id: 'a1-3',
    texte: 'Un dimanche parfait, ça commence',
    mecanique: 'bascule',
    acte: 1,
    options: ['tôt et dehors', 'tard et sous la couette'],
  },
  {
    id: 'a1-4',
    texte: 'Le silence, dans une voiture',
    mecanique: 'curseur',
    acte: 1,
    options: ['il faut le remplir', 'c’est le meilleur moment'],
  },
  {
    /*
     * Trois questions après « Ta semaine », et pas juste derrière : les deux
     * demandent un bilan de son temps récent, collées elles se répétaient.
     * `garde` est inerte tant que l'acte 1 compte huit questions pour une
     * cible de huit — il n'est jamais élagué. C'est une intention écrite pour
     * le jour où la banque s'allonge.
     */
    id: 'a1-5',
    texte: 'Trois mots pour ta journée',
    mecanique: 'le-mot',
    acte: 1,
    options: [
      'posée',
      'dense',
      'molle',
      'vive',
      'brouillonne',
      'douce',
      'longue',
      'utile',
      'bancale',
      'tranquille',
      'remplie',
      'floue',
    ],
    garde: true,
  },
  {
    id: 'a1-6',
    texte: 'Pour choisir un restaurant',
    mecanique: 'bascule',
    acte: 1,
    options: ['je tranche', 'je propose et j’attends'],
  },
  {
    id: 'a1-7',
    texte: 'Ton énergie, ce soir',
    mecanique: 'curseur',
    acte: 1,
    options: ['je tiens jusqu’à trois heures', 'je dors dans dix minutes'],
  },
  {
    /*
     * Le même geste que a1-5, retourné vers l'autre. C'est la première fois
     * qu'on dit quelque chose sur la personne en face, et ça tombe juste avant
     * l'interlude qui annonce les aveux.
     */
    id: 'a1-8',
    texte: 'Trois mots pour la personne en face',
    /* À distance, personne n'est « en face ». */
    texteADistance: 'Trois mots pour l’autre',
    mecanique: 'le-mot',
    acte: 1,
    options: [
      'drôle',
      'tendre',
      'calme',
      'solide',
      'honnête',
      'sensible',
      'libre',
      'lunaire',
      'magnétique',
      'imprévisible',
      'fidèle',
      'incroyable',
    ],
    garde: true,
  },
]

/**
 * Acte 2 — les aveux. Le registre drôle, la bêtise assumée, le pari.
 *
 * L'acte monte : il s'ouvre sur un mensonge sans conséquence et se ferme sur
 * la question la plus exposée des huit, pour que l'interlude « On ralentit »
 * atterrisse sur une pente et non sur un palier.
 *
 * Filtre de curation : rien sur l'addiction, la justice, la trahison, les
 * relations abusives ou les violences. On reste sur l'aveu qui fait rire.
 */
const ACTE_2: readonly Question[] = [
  {
    /*
     * L'ouverture de l'acte : le mensonge sans conséquence, d'où part la
     * montée décrite plus haut. `garde` empêche qu'elle soit retirée pour
     * faire de la place — il n'empêche pas qu'une perso se glisse avant elle.
     */
    id: 'a2-1',
    texte: 'Tu as déjà fait semblant d’avoir vu un film pour ne pas casser la conversation',
    mecanique: 'bascule',
    acte: 2,
    options: ['oui, et je recommencerai', 'jamais, j’avoue tout de suite'],
    garde: true,
  },
  {
    id: 'a2-2',
    texte: 'Le plus longtemps que tu aies gardé le même pyjama',
    mecanique: 'enchere',
    acte: 2,
    echelle: { min: 1, max: 14, pas: 1, unite: 'jours', uniteSing: 'jour' },
    pari: true,
  },
  {
    id: 'a2-3',
    texte: 'Manger debout devant le frigo ouvert',
    mecanique: 'curseur',
    acte: 2,
    options: ['c’est un vrai repas', 'c’est un crime'],
  },
  {
    id: 'a2-4',
    texte: 'Classe-les, du plus assumé au moins défendable',
    mecanique: 'classement',
    acte: 2,
    options: [
      'parler à un animal comme à un adulte',
      'relire trois fois un message déjà envoyé',
      'chanter très fort, seul, dans la voiture',
      'manger le fromage debout, au frigo',
    ],
  },
  {
    id: 'a2-5',
    texte: 'Combien de fois tu as regardé ton téléphone depuis qu’on a commencé',
    mecanique: 'enchere',
    acte: 2,
    echelle: { min: 0, max: 20, pas: 1, unite: 'fois', uniteSing: 'fois' },
    pari: true,
  },
  {
    id: 'a2-6',
    texte: 'Tu as déjà fait celui qui n’a pas vu, en croisant quelqu’un dans la rue',
    mecanique: 'bascule',
    acte: 2,
    options: ['souvent', 'ça ne m’arrive pas'],
  },
  {
    /*
     * Le second classement de l'acte, et volontairement sur un autre axe que
     * a2-4 : celui-là parle de ce qu'on fait et qu'on ne devrait pas, celui-ci
     * de ce que les autres font et qu'on ne supporte pas. Les quatre gênes
     * viennent toutes d'inconnus — un classement d'agacements domestiques
     * deviendrait un reproche déguisé, ce que le filtre interdit.
     */
    id: 'a2-7',
    texte: 'Dehors, du plus au moins insupportable',
    mecanique: 'classement',
    acte: 2,
    options: [
      'quelqu’un qui mâche fort',
      'quelqu’un qui raconte la fin',
      'une enceinte portable dans le train',
      'un sac posé sur le siège d’à côté',
    ],
  },
  {
    /*
     * La plus exposée de l'acte, gardée pour la fin : on avoue une gêne
     * physique, et l'autre doit deviner à quel point. C'est la marche qui
     * amène à l'acte 3.
     */
    id: 'a2-8',
    texte: 'Ta honte quand quelqu’un te voit danser',
    mecanique: 'curseur',
    acte: 2,
    options: ['aucune', 'je change de pays'],
    pari: true,
    garde: true,
  },
]

/**
 * Acte 3 — le fond. Introspectif, plus lent, plus d'air autour de chaque
 * question. L'interface se retire : la ligne ne fait plus que 1,5px et trois
 * questions sur sept n'ont carrément pas de champ de réponse.
 *
 * Trois « à voix haute » et non quatre. À quatre, plus de la moitié de l'acte
 * se joue hors de l'écran, et les mécaniques qui restent n'ont plus la place
 * de respirer entre deux moments de parole : le rythme s'affaisse au lieu de
 * descendre.
 *
 * L'acte se termine sur le tir à la corde puis la dernière parole : on place
 * à quatre mains où on en est, puis on dit tout haut ce qu'on espère. Rien ne
 * doit s'intercaler entre ces deux-là.
 *
 * Filtre de curation, plus strict encore qu'à l'acte 2 : aucune question qui
 * demande un reproche, un regret ou une comparaison. On peut être ému, jamais
 * mis en cause. Les deux pôles d'un curseur doivent rester également
 * défendables — sinon ce n'est plus une question, c'est un jugement.
 */
const ACTE_3: readonly Question[] = [
  {
    id: 'a3-1',
    texte: 'Trois mots pour l’année que tu viens de passer',
    mecanique: 'le-mot',
    acte: 3,
    options: [
      'décisive',
      'longue',
      'pleine',
      'rude',
      'lumineuse',
      'lente',
      'nette',
      'fatigante',
      'libre',
      'neuve',
      'douce',
      'chargée',
    ],
  },
  {
    id: 'a3-2',
    texte:
      'Dites-vous une chose que l’autre fait sans le savoir, et que vous aimez.',
    /* À distance on est au téléphone : « de vive voix » dit le canal sans
       supposer qu'on est dans la même pièce. La formule est la même sur les
       trois, ce qui en fait un petit rituel. */
    texteADistance:
      'Dites-le-vous de vive voix : une chose que l’autre fait sans le savoir, et que vous aimez.',
    mecanique: 'a-voix-haute',
    acte: 3,
  },
  {
    id: 'a3-3',
    texte:
      'En une semaine, combien de fois tu penses à la personne en face sans le lui dire',
    texteADistance: 'En une semaine, combien de fois tu penses à l’autre sans le lui dire',
    mecanique: 'enchere',
    acte: 3,
    echelle: { min: 0, max: 25, pas: 1, unite: 'fois', uniteSing: 'fois' },
    pari: true,
  },
  {
    id: 'a3-4',
    texte: 'Être connu par cœur par la personne en face',
    texteADistance: 'Être connu par cœur par l’autre',
    mecanique: 'curseur',
    acte: 3,
    options: ['c’est tout ce que je veux', 'j’en garde un bout pour moi'],
  },
  {
    id: 'a3-5',
    texte:
      'Dites-vous une chose que vous aimeriez faire ensemble, et que vous n’avez jamais proposée.',
    texteADistance:
      'Dites-le-vous de vive voix : une chose que vous aimeriez faire ensemble, et que vous n’avez jamais proposée.',
    mecanique: 'a-voix-haute',
    acte: 3,
  },
  {
    id: 'a3-6',
    texte: 'Où vous en êtes, tous les deux. Un seul curseur, à deux mains.',
    /* Sur deux appareils, personne ne tire sur le curseur de l'autre : chacun
       place le sien, et c'est l'écart qui se regarde. La question survit, la
       phrase change. */
    texteADistance: 'Où vous en êtes, tous les deux. Chacun le place de son côté.',
    mecanique: 'tir-a-la-corde',
    acte: 3,
    options: ['chacun sa bulle', 'collés'],
    garde: true,
  },
  {
    id: 'a3-7',
    texte:
      'Chacun son tour : dites ce que vous espérez de l’année qui vient.',
    texteADistance:
      'Chacun son tour, de vive voix : ce que vous espérez de l’année qui vient.',
    mecanique: 'a-voix-haute',
    acte: 3,
    garde: true,
  },
]

export const BANQUE: readonly Question[] = [...ACTE_1, ...ACTE_2, ...ACTE_3]
