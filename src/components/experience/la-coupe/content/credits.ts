/**
 * GÉNÉRÉ par scripts/fetch-la-coupe-photos.ts : ne pas éditer à la main.
 * `photos` : une entrée par image téléchargée (clé = nom de fichier sans
 * extension). Une image absente d'ici retombe sur son placeholder SVG.
 * `credits` : auteurs, source et URL, affichés dans « Crédits » du footer.
 */
export interface PhotoGeneree {
  width: number
  height: number
  /** Couleur dominante, affichée derrière l'image pendant son chargement. */
  couleur: string
}

export interface Credit {
  auteur: string
  source: 'Pexels'
  /** Page de l'auteur sur la source. */
  url: string
  /** Pages des photos utilisées. */
  photos: string[]
}

export const photos: Record<string, PhotoGeneree> = {
  "atelier-atelier": {
    "width": 1920,
    "height": 1280,
    "couleur": "#a8a898"
  },
  "atelier-construire": {
    "width": 1920,
    "height": 1080,
    "couleur": "#e8e8d8"
  },
  "atelier-dessiner": {
    "width": 1920,
    "height": 1080,
    "couleur": "#a8a898"
  },
  "atelier-ecouter": {
    "width": 1920,
    "height": 1080,
    "couleur": "#e8e8d8"
  },
  "atelier-equipe-01": {
    "width": 1440,
    "height": 1440,
    "couleur": "#b8b8a8"
  },
  "atelier-equipe-02": {
    "width": 1440,
    "height": 1440,
    "couleur": "#d8d8d8"
  },
  "atelier-equipe-03": {
    "width": 1440,
    "height": 1440,
    "couleur": "#e8e8d8"
  },
  "atelier-equipe-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#b8a898"
  },
  "atelier-equipe-05": {
    "width": 1440,
    "height": 1440,
    "couleur": "#c8b8a8"
  },
  "atelier-equipe-06": {
    "width": 1440,
    "height": 1440,
    "couleur": "#b8b8b8"
  },
  "atelier-portrait": {
    "width": 1536,
    "height": 1920,
    "couleur": "#382818"
  },
  "belvedere-du-vercors-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#5898c8"
  },
  "belvedere-du-vercors-02": {
    "width": 1536,
    "height": 1920,
    "couleur": "#c8b8a8"
  },
  "belvedere-du-vercors-03": {
    "width": 1920,
    "height": 1280,
    "couleur": "#c8b8a8"
  },
  "belvedere-du-vercors-04": {
    "width": 1224,
    "height": 1224,
    "couleur": "#d8d8c8"
  },
  "belvedere-du-vercors-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#c8c8b8"
  },
  "belvedere-du-vercors-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#b8c8d8"
  },
  "ecole-des-hauts-champs-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#a8a898"
  },
  "ecole-des-hauts-champs-02": {
    "width": 1632,
    "height": 1088,
    "couleur": "#a89878"
  },
  "ecole-des-hauts-champs-03": {
    "width": 1536,
    "height": 1920,
    "couleur": "#b89868"
  },
  "ecole-des-hauts-champs-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#886858"
  },
  "ecole-des-hauts-champs-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#f8f8e8"
  },
  "ecole-des-hauts-champs-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#d8b898"
  },
  "extension-aux-lilas-01": {
    "width": 1536,
    "height": 1920,
    "couleur": "#081818"
  },
  "extension-aux-lilas-02": {
    "width": 1920,
    "height": 1280,
    "couleur": "#584838"
  },
  "extension-aux-lilas-03": {
    "width": 1440,
    "height": 1440,
    "couleur": "#682818"
  },
  "extension-aux-lilas-04": {
    "width": 1920,
    "height": 1080,
    "couleur": "#e8d8c8"
  },
  "extension-aux-lilas-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#081808"
  },
  "extension-aux-lilas-06": {
    "width": 1536,
    "height": 1920,
    "couleur": "#181808"
  },
  "halle-saint-ouen-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#181818"
  },
  "halle-saint-ouen-02": {
    "width": 1920,
    "height": 1280,
    "couleur": "#a8b8a8"
  },
  "halle-saint-ouen-03": {
    "width": 1536,
    "height": 1920,
    "couleur": "#885838"
  },
  "halle-saint-ouen-04": {
    "width": 1920,
    "height": 1280,
    "couleur": "#181818"
  },
  "halle-saint-ouen-05": {
    "width": 1440,
    "height": 1440,
    "couleur": "#382828"
  },
  "halle-saint-ouen-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#585858"
  },
  "halle-saint-ouen-07": {
    "width": 1920,
    "height": 1280,
    "couleur": "#080808"
  },
  "les-terrasses-du-canal-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#685848"
  },
  "les-terrasses-du-canal-02": {
    "width": 1536,
    "height": 1920,
    "couleur": "#d8d8c8"
  },
  "les-terrasses-du-canal-03": {
    "width": 1920,
    "height": 1280,
    "couleur": "#685848"
  },
  "les-terrasses-du-canal-04": {
    "width": 1224,
    "height": 1224,
    "couleur": "#785848"
  },
  "les-terrasses-du-canal-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#988888"
  },
  "les-terrasses-du-canal-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#f8f8e8"
  },
  "les-terrasses-du-canal-07": {
    "width": 1536,
    "height": 1920,
    "couleur": "#c8c8d8"
  },
  "les-terrasses-du-canal-08": {
    "width": 1920,
    "height": 1280,
    "couleur": "#e8e8d8"
  },
  "lumiere-fossile-01": {
    "width": 1920,
    "height": 1280,
    "couleur": "#282828"
  },
  "lumiere-fossile-02": {
    "width": 1536,
    "height": 1920,
    "couleur": "#180808"
  },
  "lumiere-fossile-03": {
    "width": 1920,
    "height": 1080,
    "couleur": "#080808"
  },
  "lumiere-fossile-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#281818"
  },
  "lumiere-fossile-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#383828"
  },
  "lumiere-fossile-06": {
    "width": 1536,
    "height": 1920,
    "couleur": "#181818"
  },
  "maison-des-vignes-01": {
    "width": 1920,
    "height": 1280,
    "couleur": "#685848"
  },
  "maison-des-vignes-02": {
    "width": 1536,
    "height": 1920,
    "couleur": "#887868"
  },
  "maison-des-vignes-03": {
    "width": 1920,
    "height": 1080,
    "couleur": "#282818"
  },
  "maison-des-vignes-04": {
    "width": 1920,
    "height": 1280,
    "couleur": "#281808"
  },
  "maison-des-vignes-05": {
    "width": 1440,
    "height": 1440,
    "couleur": "#285878"
  },
  "maison-des-vignes-06": {
    "width": 1920,
    "height": 1280,
    "couleur": "#b8b8a8"
  },
  "maison-des-vignes-07": {
    "width": 1075,
    "height": 1344,
    "couleur": "#6888a8"
  },
  "maison-des-vignes-08": {
    "width": 1920,
    "height": 1080,
    "couleur": "#080808"
  },
  "mediatheque-des-tanneurs-01": {
    "width": 1920,
    "height": 1280,
    "couleur": "#281818"
  },
  "mediatheque-des-tanneurs-02": {
    "width": 1920,
    "height": 1080,
    "couleur": "#887868"
  },
  "mediatheque-des-tanneurs-03": {
    "width": 1536,
    "height": 1920,
    "couleur": "#f8f8e8"
  },
  "mediatheque-des-tanneurs-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#c8a878"
  },
  "mediatheque-des-tanneurs-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#989888"
  },
  "mediatheque-des-tanneurs-06": {
    "width": 1536,
    "height": 1920,
    "couleur": "#c8c8b8"
  },
  "mediatheque-des-tanneurs-07": {
    "width": 1920,
    "height": 1080,
    "couleur": "#181818"
  },
  "mediatheque-des-tanneurs-08": {
    "width": 1920,
    "height": 1280,
    "couleur": "#887868"
  },
  "mediatheque-des-tanneurs-09": {
    "width": 1440,
    "height": 1440,
    "couleur": "#884818"
  }
}

export const credits: Credit[] = [
  {
    "auteur": "A.",
    "source": "Pexels",
    "url": "https://www.pexels.com/@a-1620746",
    "photos": [
      "https://www.pexels.com/photo/empty-concert-hall-5902297/"
    ]
  },
  {
    "auteur": "Alexander Mass",
    "source": "Pexels",
    "url": "https://www.pexels.com/@rebornfilmes",
    "photos": [
      "https://www.pexels.com/photo/a-small-cabin-with-a-black-roof-and-a-wooden-door-27638198/",
      "https://www.pexels.com/photo/historic-brick-building-with-vintage-windows-33647857/"
    ]
  },
  {
    "auteur": "Ali Ahmad DANESH",
    "source": "Pexels",
    "url": "https://www.pexels.com/@ali-ahmad-danesh-177079090",
    "photos": [
      "https://www.pexels.com/photo/empty-seats-in-a-classroom-12168815/"
    ]
  },
  {
    "auteur": "Alina Skazka",
    "source": "Pexels",
    "url": "https://www.pexels.com/@alinaskazka",
    "photos": [
      "https://www.pexels.com/photo/wooden-railings-of-the-staircase-15357661/"
    ]
  },
  {
    "auteur": "Anastasiya Badun",
    "source": "Pexels",
    "url": "https://www.pexels.com/@badun",
    "photos": [
      "https://www.pexels.com/photo/staircase-in-a-building-18420993/"
    ]
  },
  {
    "auteur": "Andrew Patrick Photo",
    "source": "Pexels",
    "url": "https://www.pexels.com/@am83",
    "photos": [
      "https://www.pexels.com/photo/windows-of-apartments-27053882/"
    ]
  },
  {
    "auteur": "Anete Lusina",
    "source": "Pexels",
    "url": "https://www.pexels.com/@anete-lusina",
    "photos": [
      "https://www.pexels.com/photo/pen-with-ruler-and-eyeglasses-placed-on-house-plan-4792480/",
      "https://www.pexels.com/photo/project-on-papers-7257156/"
    ]
  },
  {
    "auteur": "Antonio  Tose",
    "source": "Pexels",
    "url": "https://www.pexels.com/@antonio-tose-298756153",
    "photos": [
      "https://www.pexels.com/photo/brown-wooden-house-on-mountain-13351603/"
    ]
  },
  {
    "auteur": "Ayşenaz  Bilgin",
    "source": "Pexels",
    "url": "https://www.pexels.com/@aysenaz-bilgin-421884106",
    "photos": [
      "https://www.pexels.com/photo/darkness-in-empty-corridor-15295143/"
    ]
  },
  {
    "auteur": "Bel Chua",
    "source": "Pexels",
    "url": "https://www.pexels.com/@bel-chua-2154963449",
    "photos": [
      "https://www.pexels.com/photo/contemporary-architecture-with-skylight-roof-33785405/"
    ]
  },
  {
    "auteur": "Boys in Bristol Photography",
    "source": "Pexels",
    "url": "https://www.pexels.com/@lebele",
    "photos": [
      "https://www.pexels.com/photo/brown-concrete-building-8227649/"
    ]
  },
  {
    "auteur": "chris clark",
    "source": "Pexels",
    "url": "https://www.pexels.com/@chris-clark-1933184",
    "photos": [
      "https://www.pexels.com/photo/river-descending-on-rocks-19850782/"
    ]
  },
  {
    "auteur": "Colin G",
    "source": "Pexels",
    "url": "https://www.pexels.com/@colin-g-667753876",
    "photos": [
      "https://www.pexels.com/photo/historic-pevensey-castle-wall-in-spring-37116377/"
    ]
  },
  {
    "auteur": "cottonbro studio",
    "source": "Pexels",
    "url": "https://www.pexels.com/@cottonbro",
    "photos": [
      "https://www.pexels.com/photo/wooden-tables-inside-the-library-6333732/",
      "https://www.pexels.com/photo/brown-wooden-chairs-and-tables-6333728/"
    ]
  },
  {
    "auteur": "Crab Lens",
    "source": "Pexels",
    "url": "https://www.pexels.com/@crab-lens-179881567",
    "photos": [
      "https://www.pexels.com/photo/stone-house-on-top-of-the-mountain-13271409/"
    ]
  },
  {
    "auteur": "David Underland",
    "source": "Pexels",
    "url": "https://www.pexels.com/@david-underland",
    "photos": [
      "https://www.pexels.com/photo/corrugated-metal-construction-17511606/"
    ]
  },
  {
    "auteur": "Doğan Alpaslan  Demir",
    "source": "Pexels",
    "url": "https://www.pexels.com/@izafi",
    "photos": [
      "https://www.pexels.com/photo/rustic-stone-house-facade-in-kozbeyli-38101593/"
    ]
  },
  {
    "auteur": "DS stories",
    "source": "Pexels",
    "url": "https://www.pexels.com/@ds-stories",
    "photos": [
      "https://www.pexels.com/photo/a-pencil-on-a-notebook-beside-a-steel-blade-measuring-tape-6991324/"
    ]
  },
  {
    "auteur": "Engin Akyurt",
    "source": "Pexels",
    "url": "https://www.pexels.com/@enginakyurt",
    "photos": [
      "https://www.pexels.com/photo/small-holes-on-solid-rough-surface-5503423/"
    ]
  },
  {
    "auteur": "Francesco Ungaro",
    "source": "Pexels",
    "url": "https://www.pexels.com/@francesco-ungaro",
    "photos": [
      "https://www.pexels.com/photo/window-in-wooden-facade-of-residential-building-18513513/",
      "https://www.pexels.com/photo/wooden-facade-of-residential-building-with-windows-18513512/"
    ]
  },
  {
    "auteur": "Garrison Gao",
    "source": "Pexels",
    "url": "https://www.pexels.com/@garrison-gao-56316964",
    "photos": [
      "https://www.pexels.com/photo/wooden-model-in-close-up-7883886/"
    ]
  },
  {
    "auteur": "Guy Joben",
    "source": "Pexels",
    "url": "https://www.pexels.com/@guyjoben",
    "photos": [
      "https://www.pexels.com/photo/people-in-a-gallery-in-shadow-16293865/"
    ]
  },
  {
    "auteur": "Helena Jankovičová Kováčová",
    "source": "Pexels",
    "url": "https://www.pexels.com/@helen1",
    "photos": [
      "https://www.pexels.com/photo/trees-growing-in-courtyard-next-to-house-13061788/"
    ]
  },
  {
    "auteur": "Ihsan Adityawarman",
    "source": "Pexels",
    "url": "https://www.pexels.com/@ihsanaditya",
    "photos": [
      "https://www.pexels.com/photo/a-gas-lamp-hanging-on-stick-7771960/"
    ]
  },
  {
    "auteur": "Ila Bappa Ibrahim",
    "source": "Pexels",
    "url": "https://www.pexels.com/@ilabappa",
    "photos": [
      "https://www.pexels.com/photo/a-wall-made-of-bricks-7394220/"
    ]
  },
  {
    "auteur": "Jean-Paul Wettstein",
    "source": "Pexels",
    "url": "https://www.pexels.com/@jean-paul-wettstein-677916508",
    "photos": [
      "https://www.pexels.com/photo/dramatic-cliffs-of-creux-du-van-nature-reserve-33497256/"
    ]
  },
  {
    "auteur": "Katia Miasoed",
    "source": "Pexels",
    "url": "https://www.pexels.com/@katia-miasoed-624959709",
    "photos": [
      "https://www.pexels.com/photo/glass-rooftop-with-wooden-frame-18039229/"
    ]
  },
  {
    "auteur": "Kevin Chuang",
    "source": "Pexels",
    "url": "https://www.pexels.com/@kevin-chuang-268383612",
    "photos": [
      "https://www.pexels.com/photo/empty-warehouse-with-concrete-floor-12771396/"
    ]
  },
  {
    "auteur": "Laura  Meinhardt",
    "source": "Pexels",
    "url": "https://www.pexels.com/@leefinvrede",
    "photos": [
      "https://www.pexels.com/photo/corridor-of-an-abandoned-sanatorium-27015942/"
    ]
  },
  {
    "auteur": "Laura Cleffmann",
    "source": "Pexels",
    "url": "https://www.pexels.com/@cloudett",
    "photos": [
      "https://www.pexels.com/photo/structural-steel-frame-against-clear-sky-31197870/"
    ]
  },
  {
    "auteur": "Lewis Bedar",
    "source": "Pexels",
    "url": "https://www.pexels.com/@lewis-bedar-2161633421",
    "photos": [
      "https://www.pexels.com/photo/modern-concrete-architecture-ceiling-design-37624446/"
    ]
  },
  {
    "auteur": "Luis Quintero",
    "source": "Pexels",
    "url": "https://www.pexels.com/@jibarofoto",
    "photos": [
      "https://www.pexels.com/photo/building-2257452/"
    ]
  },
  {
    "auteur": "Matheus Bertelli",
    "source": "Pexels",
    "url": "https://www.pexels.com/@bertellifotografia",
    "photos": [
      "https://www.pexels.com/photo/interior-of-kitchen-in-rustic-style-house-7163611/"
    ]
  },
  {
    "auteur": "Max Vakhtbovych",
    "source": "Pexels",
    "url": "https://www.pexels.com/@artbovich",
    "photos": [
      "https://www.pexels.com/photo/white-table-cloth-on-table-8143676/",
      "https://www.pexels.com/photo/room-on-attic-8082327/",
      "https://www.pexels.com/photo/white-wooden-bed-with-white-linen-and-pillows-7746578/"
    ]
  },
  {
    "auteur": "Munkee Panic",
    "source": "Pexels",
    "url": "https://www.pexels.com/@munkee-panic-272941",
    "photos": [
      "https://www.pexels.com/photo/house-interior-1091428/"
    ]
  },
  {
    "auteur": "Neil Ni",
    "source": "Pexels",
    "url": "https://www.pexels.com/@throughnislens",
    "photos": [
      "https://www.pexels.com/photo/abstract-view-of-industrial-metal-structure-30920670/"
    ]
  },
  {
    "auteur": "Ngọc Khánh Nek",
    "source": "Pexels",
    "url": "https://www.pexels.com/@ng-c-khanh-nek-2149899382",
    "photos": [
      "https://www.pexels.com/photo/vintage-vietnamese-apartment-balcony-view-31053204/"
    ]
  },
  {
    "auteur": "Noémi Móricz",
    "source": "Pexels",
    "url": "https://www.pexels.com/@noemi-moricz-773289151",
    "photos": [
      "https://www.pexels.com/photo/red-facade-of-a-building-19797394/"
    ]
  },
  {
    "auteur": "Phil Ledwith",
    "source": "Pexels",
    "url": "https://www.pexels.com/@phil-ledwith-2738622",
    "photos": [
      "https://www.pexels.com/photo/charming-courtyard-in-historic-dyrham-estate-39480949/"
    ]
  },
  {
    "auteur": "Ron Lach",
    "source": "Pexels",
    "url": "https://www.pexels.com/@ron-lach",
    "photos": [
      "https://www.pexels.com/photo/close-up-on-mans-hands-on-drawing-on-deck-9617407/",
      "https://www.pexels.com/photo/directly-above-view-on-deck-with-drawing-accessories-9616964/",
      "https://www.pexels.com/photo/coffee-and-drawing-accessories-on-deck-9616963/",
      "https://www.pexels.com/photo/man-hands-holding-compass-over-sketch-9617896/",
      "https://www.pexels.com/photo/spatial-planning-architectural-model-9618124/"
    ]
  },
  {
    "auteur": "Saeed Khokhar",
    "source": "Pexels",
    "url": "https://www.pexels.com/@vip-foto",
    "photos": [
      "https://www.pexels.com/photo/wooden-frame-of-roof-on-concrete-building-8491085/"
    ]
  },
  {
    "auteur": "Sali Ajeti",
    "source": "Pexels",
    "url": "https://www.pexels.com/@slrajeti",
    "photos": [
      "https://www.pexels.com/photo/modern-scandinavian-apartment-building-exterior-37028690/"
    ]
  },
  {
    "auteur": "Stanislav Kondratiev",
    "source": "Pexels",
    "url": "https://www.pexels.com/@technobulka",
    "photos": [
      "https://www.pexels.com/photo/an-old-brick-building-5983971/"
    ]
  },
  {
    "auteur": "Tahir Osman",
    "source": "Pexels",
    "url": "https://www.pexels.com/@tahir-osman-109306362",
    "photos": [
      "https://www.pexels.com/photo/staircase-in-house-19514336/"
    ]
  },
  {
    "auteur": "Thirdman",
    "source": "Pexels",
    "url": "https://www.pexels.com/@thirdman",
    "photos": [
      "https://www.pexels.com/photo/overhead-photo-of-an-architect-s-deisgn-5582599/",
      "https://www.pexels.com/photo/miniature-street-in-close-up-shot-5583620/"
    ]
  },
  {
    "auteur": "Tim Mossholder",
    "source": "Pexels",
    "url": "https://www.pexels.com/@timmossholder",
    "photos": [
      "https://www.pexels.com/photo/wooden-surface-3468702/"
    ]
  },
  {
    "auteur": "Tima Miroshnichenko",
    "source": "Pexels",
    "url": "https://www.pexels.com/@tima-miroshnichenko",
    "photos": [
      "https://www.pexels.com/photo/floor-plans-on-white-table-6615036/",
      "https://www.pexels.com/photo/mechanical-pencil-on-notepad-with-sketch-6614748/",
      "https://www.pexels.com/photo/person-people-building-construction-6615233/"
    ]
  },
  {
    "auteur": "tom analogicus",
    "source": "Pexels",
    "url": "https://www.pexels.com/@analogicus",
    "photos": [
      "https://www.pexels.com/photo/intricate-wooden-structure-with-geometric-design-39167563/"
    ]
  },
  {
    "auteur": "Viktor Mogilat",
    "source": "Pexels",
    "url": "https://www.pexels.com/@mogilat",
    "photos": [
      "https://www.pexels.com/photo/photo-of-store-front-3988037/"
    ]
  },
  {
    "auteur": "Vitali Adutskevich",
    "source": "Pexels",
    "url": "https://www.pexels.com/@vadutskevich",
    "photos": [
      "https://www.pexels.com/photo/brick-wall-and-a-staircase-15501338/"
    ]
  },
  {
    "auteur": "wal_ 172619",
    "source": "Pexels",
    "url": "https://www.pexels.com/@wal_-172619-2156618639",
    "photos": [
      "https://www.pexels.com/photo/textured-brown-concrete-surface-background-35977366/"
    ]
  },
  {
    "auteur": "Yaroslav Shuraev",
    "source": "Pexels",
    "url": "https://www.pexels.com/@yaroslav-shuraev",
    "photos": [
      "https://www.pexels.com/photo/a-person-holding-a-pencil-6282077/"
    ]
  },
  {
    "auteur": "zeynepshoots",
    "source": "Pexels",
    "url": "https://www.pexels.com/@zeynepshoots-2151869851",
    "photos": [
      "https://www.pexels.com/photo/sunny-wooden-pergola-walkway-in-park-setting-34676954/"
    ]
  },
  {
    "auteur": "Zhengdong Hu",
    "source": "Pexels",
    "url": "https://www.pexels.com/@zhengdong-hu-297240489",
    "photos": [
      "https://www.pexels.com/photo/sunny-interior-of-library-15465922/"
    ]
  }
]
