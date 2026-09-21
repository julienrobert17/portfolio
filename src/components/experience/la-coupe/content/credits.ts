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
  /** Largeurs disponibles : `<cle>-<largeur>.avif` et `.webp`. */
  largeurs: number[]
  /** Aperçu 24 px flouté (data URI), visible avant l'image. */
  lqip: string
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
    "couleur": "#a8a898",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAAAQBACdASoYABAAPtFUo0uoJKMhsAgBABoJZwDE2BYH/sVM5QifoANVwAD+mT/hzDr4jtO8YSmFzhV/9lPGdGcN9/mkiOJnF13mpkOh2unNntWKs+TqtsuksyAAAA=="
  },
  "atelier-construire": {
    "width": 1920,
    "height": 1080,
    "couleur": "#e8e8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAADQAwCdASoYAA4APtFUo0uoJKMhsAgBABoJQBOmUABhbpxjqBgHu8AA/t7d2PB+xL8VIGS9HRm5lrc0p9AdT4j2T+hOIhpxL2O+o+I2mRQ92kItR8AAAA=="
  },
  "atelier-dessiner": {
    "width": 1920,
    "height": 1080,
    "couleur": "#a8a898",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAACwAwCdASoYAA4APtFYpkwoJSOiMAgBABoJZQCdAB6Q896O0rHrAAD+VGXhzC2XLobOzLWmmj0HQvwL4lVNhJ7YJmgAAA=="
  },
  "atelier-ecouter": {
    "width": 1920,
    "height": 1080,
    "couleur": "#e8e8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADQAwCdASoYAA4APtFcpkyoJSOiMAgBABoJYwC06CHfuYOfd3O2VAAA/vHEn8ryMlgkQiGEk7YH2EHEN+0Sn/pRKidJWAAA"
  },
  "atelier-equipe-01": {
    "width": 1920,
    "height": 1920,
    "couleur": "#b8b8a8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpYAAABXRUJQVlA4IIoAAACQBQCdASoYABgAPtFapU2oJSMiKA1RABoJYwCdMoABqE7qM6OszOl3aJrgvbRMEyeDMXKhAAD+8NSTfF9RMa/WumfFuRgH4KNTn/pjMXIbmsBusJ3UePRUCwi57zBlraL8siXMivYWAPptxdmfEXAT9Qx0ll6jqhRBPrwhW9oiNCDRKwEsTSXfQAA="
  },
  "atelier-equipe-02": {
    "width": 1920,
    "height": 1920,
    "couleur": "#d8d8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpAAAABXRUJQVlA4IIQAAACQBQCdASoYABgAPtFSpEwoJCOiMBgMAQAaCWUAxkAOFzhpU1036Z9LXVUSpZnCcJ/4dF1OAAD+wT6zVFeatE+9FT7kwCTcbDFcU5ps9olcbEFJuFXCR15XjxD3bstCYVxhrwfyvvYNobNv5uJchjeyjxTIZYbbytrVOZIN8F3IwdUAQAA="
  },
  "atelier-equipe-03": {
    "width": 1920,
    "height": 1920,
    "couleur": "#e8e8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRn4AAABXRUJQVlA4IHIAAAAwBQCdASoYABgAPtFYpEyoJSOiKA1RABoJZQDA3A6+Vq40mwWw5b+oFlf206Kqh4ldUAD+7Nq4yYU/Wsk5uItELbeQKfOhHeLZ6Qzwl48O8BLBmxrLpjGjz3BQRmoe3ipVrA/esJTnnGvFKpGlaE9wAAA="
  },
  "atelier-equipe-04": {
    "width": 1920,
    "height": 1920,
    "couleur": "#b8a898",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAADwBACdASoYABgAPtFapk4oJKOiKAqpABoJZQCdAA13MBDh+Jl4IkxcZG/7lwWRLIAA/uRoBeQKF1xgJzI6ccV2/cU+RgzvlFHNUkvKj33ja1BIDVjt2o2nWyYjpiXUY/YKhZYZRk6n5ndNlsJfDsO68YJeYDbq79lY/rFa5q6LQAAA"
  },
  "atelier-equipe-05": {
    "width": 1920,
    "height": 1920,
    "couleur": "#c8b8a8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAABQBQCdASoYABgAPsVUn0unpSKht/VYAPAYiWUAtOgPAXJzpgM9IjjEyOZJjE8Oc3KkY4AA/lRK/+Ul03t5JkNaZCudSvR5P1j7se/B9DVaWtYSDHZFQw/chWEDEt4FwUdluVBKx7otcwKR0hJNcES+gNeq74AA"
  },
  "atelier-equipe-06": {
    "width": 1920,
    "height": 1920,
    "couleur": "#b8b8b8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRoQAAABXRUJQVlA4IHgAAACQBQCdASoYABgAPsFMn0unpCKht/qoAPAYCUAVhm5IYCXFAQifquEvqYZH7e/IsGBabNESAAD+fnJCe7TXS2GgocRpTgiuLIawBNJvAB7eJ4/WLhC+V2LeFO41qMWcpFDUDP0Zm17EHPV9Yd+7EzRNUilVct1tQAA="
  },
  "atelier-portrait": {
    "width": 1920,
    "height": 2400,
    "couleur": "#382818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAACQBQCdASoYAB4APtFcqU4oJSQiKAqpABoJZQCdMy/BxV7uHiwWY00oaZ8yZ25Ixvly0LxkAAD+7EBsorz4/Ga3cTuzy6ZBReK151Pqenxj70ixrg1nMl8dIF5IpPnKzd37g54E3Awy/FNn0s6inI9fQ2eTowm9r+66YhwbILFo67dkH5IDkWG2BtgvI1ay1L9P6aSHgAA="
  },
  "belvedere-du-vercors-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#5898c8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADQAwCdASoYAA4APtFYpEwoJSOiMAgBABoJYgCdABewzcWvEoZOTuAA96UktbRFgnM8iUmRKyCGqMOdwSVMIYZnJX97ryW8ooxAMvRlOvsIV9anAAA="
  },
  "belvedere-du-vercors-02": {
    "width": 1920,
    "height": 2400,
    "couleur": "#c8b8a8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAQBACdASoYAB4APsFSo0unpSOhsAwA8BgJZwDBzCHWOhjezSkPsk3QAAD+0yZaiabz4dR6aRZ2UzaRnZ/vHV7tXrsR9p7ys0eCDfBjimQb3TGtZA2wiAAwI82632AA"
  },
  "belvedere-du-vercors-03": {
    "width": 1920,
    "height": 1280,
    "couleur": "#c8b8a8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADwAwCdASoYABAAPtFipk0oJiOiMAgBABoJZQCnFB4+yX7iwnK88JwAAP5kip5DhaJSx/APg5rk+Pm7L5vfiUpCL+0wBwkUj/AAAA=="
  },
  "belvedere-du-vercors-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#d8d8c8",
    "largeurs": [
      480,
      800,
      960,
      1440
    ],
    "lqip": "data:image/webp;base64,UklGRowAAABXRUJQVlA4IIAAAAAwBQCdASoYABgAPtFUpUuoJKOhsBgMAQAaCWUAt7gPCATtCdjPIGsWtSq86UElxdcPwAD+m3jirsdxMYRntfu5HHfkItpadCz6TXEvv8b3gZe56EB9bqKbpbWQ3EWHx9udlk126okt0i9w5i/7VSm0K15BzFGIWEZ97bdlzwAAAA=="
  },
  "belvedere-du-vercors-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#c8c8b8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAACQAwCdASoYABAAPtFcpkyoJSOiMAgBABoJZwCw7CHu32AIIaeAAP6u/tcvfG5MB2crtCT73xbtR+S5MGkAAA=="
  },
  "belvedere-du-vercors-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#b8c8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAADwAwCdASoYAA4APtFUpEuoJKOhsAgBABoJQBOmUABsLavip+Y9VFjmAP6OEyda3X16Lv5VCPndpVTewwEm1qUq7b3BL6hOeH7HkbBEY/aXFowBhAc7og4lAB6AAA=="
  },
  "ecole-des-hauts-champs-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#a8a898",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoYAA4APtFapkyoJSOiMAgBABoJZQC06CEuADU0uK6vUAD9zuvm+P4qqresqcHMSWeNqb/BlTX1Xmun4dYMOAsfLHjjEIGSyHGIARtxtID2gAAA"
  },
  "ecole-des-hauts-champs-02": {
    "width": 1920,
    "height": 1280,
    "couleur": "#a89878",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAABQAwCdASoYABAAPtFWpEuqpKOhsAgBUBoJZQCsAELm7/e9AAD9/GxqmUho0/BUUUU9VflXxEAAAA=="
  },
  "ecole-des-hauts-champs-03": {
    "width": 1920,
    "height": 2400,
    "couleur": "#b89868",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpYAAABXRUJQVlA4IIoAAACQBQCdASoYAB4APtFgpUyoJiOiMBgIAQAaCWMAnTKAAZxBPclwTepSVgrK75WV76UYSu8uAAD+U4oeSkY1a1VNUBBhMyD7uZTmM9fYnQZmVFxIHVVInCCAasVSnbRFYwI4qN9d6EcgKFg8UdN78ir1ZjWLkSEKyy2MPwBfm7uBF3AAofjXLKTAAAA="
  },
  "ecole-des-hauts-champs-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#886858",
    "largeurs": [
      480,
      800,
      960,
      1440
    ],
    "lqip": "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAAAQBACdASoYABgAPtFUpU2oJCMiMBgIAQAaCWUAACGo4l7tKjne0tc8AAD+cRzzV96bPc3e6+/gmtORupYVW+ZNiUi9nKR+B4S2N5J3bzGtiHZSn44AAA=="
  },
  "ecole-des-hauts-champs-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#f8f8e8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAAAwBACdASoYABAAPtFUpEuoJKOhsAgBABoJYwCdMoADg494FvJDtO8NngAA/vH0uVpcPqZdu9LoHWKAUglVHOAwYExItvInJpfwptox1R+iaZCc4g98IN9dNMCSeMdGY5W4kAAA"
  },
  "ecole-des-hauts-champs-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#d8c8b8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAACwBACdASoYAA4APtFWpEuoJKOhsAgBABoJQBOmUI7gBY//MoVutQ544QDyd5bAAP5lFOWzkMFbUQGjpmNeY9WoGv4WZ0yWptE1O7R4tKMzZXpfiX4p4Wk7dpAAAA=="
  },
  "extension-aux-lilas-01": {
    "width": 1920,
    "height": 2400,
    "couleur": "#081818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpwAAABXRUJQVlA4IJAAAABwBQCdASoYAB4APsFMokunpCOht/qoAPAYCUAVx6QAXtoy4pWSEEEomwL9xvz6cB8gjPhQAP7pSz4m5u8T+5j6bHgZ5zCWWIMc0Ee9kPUJI6Ahn8Laew1bX2GjGZoMg4shU8PbWquHso6kuXksRzFPbL4Aj286mHX0LK5VqKPbbl4vHX28dc7qqe0fXK4AAAA="
  },
  "extension-aux-lilas-02": {
    "width": 1920,
    "height": 1280,
    "couleur": "#584838",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAADwAwCdASoYABAAPtFWpUwoJKOiMAgBABoJQBOgA4WinxvQcxG7vEygAP3e50uQXYDRjsPFV5SnVjLfwmgmjpvWafBmeAQOy+BhQU8l1lS8pwibCgYcYoQz9BGLmcvwMoAAAA=="
  },
  "extension-aux-lilas-03": {
    "width": 1920,
    "height": 1920,
    "couleur": "#682818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADQAwCdASoYABgAPtFUpk2qpCOiMBgIAVAaCUAVHoKolH8qk3XQjAAA/uuoldj5cYTVgXfWvP3Iv7Sc3vjNyBa5QhoRCM9xuU1+6bG/RcXD4yyPaT+10togAAA="
  },
  "extension-aux-lilas-04": {
    "width": 1920,
    "height": 1080,
    "couleur": "#d8c8b8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAACwAwCdASoYAA4APtFYpEwoJSOiMAgBABoJYwCdABrh1qkYg1qoQAD6PZKMuDZg4lGH8o7JHkrG8O3raa8WaHJNZ6GG5gfWSkrQr10xggAAAA=="
  },
  "extension-aux-lilas-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#080808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAAAQBACdASoYABAAPtFYpEwoJSOiMAgBABoJYwC7ACHhnav797CTOlzaIAD+9XkX5bKbtK4FhvKPetWMUWKsQ01HpmjQq6W8rINelOuU/mB3AAAA"
  },
  "extension-aux-lilas-06": {
    "width": 1920,
    "height": 2400,
    "couleur": "#181808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRtYAAABXRUJQVlA4IMoAAADwBQCdASoYAB4APtFUpk4oJCOiMBgIAQAaCWcAv+wQiEZBMpvOzogZkusUd/1kyfi2EKwnK2aXAAD+bGqfDY16566iBwCZYvx12fmH5AipnCSzUFWQ+jS4cgyXdRWOffnpv/Txt66TUvVn/f5BGeCky72qisWFEAtvrqIs8Cn7U4LlsUXVESzSVklCCiv1aq4CO0osP2UtJH4wSawiMMTW2b96M2suA9+xhooBAZsbNTacV2GnZ3ESHSHYoGObWnXD9sca/lg3UgAA"
  },
  "halle-saint-ouen-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#181818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAADwAwCdASoYAA4APtFUpEuoJKOhsAgBABoJZwDImB0688saGptC46eAAP7xEo6QjjhQ+lQKejlajnrC50KReo6uXWCE05Xs5Nvsmh6wMCjzkxrT9vIqMf/oVeofjQLBxMUAAA=="
  },
  "halle-saint-ouen-02": {
    "width": 1920,
    "height": 1280,
    "couleur": "#a8b8a8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAABQBACdASoYABAAPtFapkyoJSOiMAgBABoJZwDE2CG8I+xnpL/Y1qaB88CoAP6uvl+vEMV5x23QJIksF7ETxVjvLvGKdutq0009FHvu+OHWQAAA"
  },
  "halle-saint-ouen-03": {
    "width": 1920,
    "height": 2400,
    "couleur": "#885838",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAACwBACdASoYAB4APtFUpE2oJCMiMBgIAQAaCWUAnQAWcqFyBGiQ0pDm77Tcwz3YAP7qCvg/OSrzdnEldU/hDw3Xm+98THbILZYHdBJHcZzzTg5B2y15KpcZo8p2Wwo+46UfWHQZWPfpcqs9dQAAAA=="
  },
  "halle-saint-ouen-04": {
    "width": 1920,
    "height": 1280,
    "couleur": "#181818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAABQBACdASoYABAAPtFUo0uoJKMhsAgBABoJYwCdOUAAw+S+B1jhMhYFwTVAAPeGb9sDKqvbUv/0Y57Jft+bdPXSRP7SbAEt9bkQUIAIbDZVZ0TYOJLuRiAbGIie2JkYrAQ16gAA"
  },
  "halle-saint-ouen-05": {
    "width": 1920,
    "height": 1920,
    "couleur": "#382828",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpAAAABXRUJQVlA4IIQAAACQBQCdASoYABgAPtFapk2oJSOiMBgIAQAaCUATplAAo+pb2pOplQfaJQrf6H3r5v6Pq/xiAAD+8Md2zPnClfbhZm2mQz+8qJfknTk+r291sWP2IjemmV6H7SnQPtjR3BSmwnpFD6mmRJdjoD3aL2yZXKWYFUbXm5sUWOZ3C2bS8cPAAAA="
  },
  "halle-saint-ouen-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#585858",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoYAA4APtFcpkyoJSOiMAgBABoJZwDE2BehNVFAR6LXoAD+vz0lYkTaMEUy0MnoKeZVxHai6AO66pCTiyGibJEFLBvOqOEfgAA="
  },
  "halle-saint-ouen-07": {
    "width": 1920,
    "height": 1280,
    "couleur": "#080808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAADQAwCdASoYABAAPtFapkyoJSOiMAgBABoJQBadA3SJ71Kg3rV7u8AA/obwutqHJawcuu/3bYrHRrVJltgjqcr2d1VZ1Eh/mVqP/5jfOjs/ywvzvKBMPqwovsOFWkAA"
  },
  "les-terrasses-du-canal-01": {
    "width": 1920,
    "height": 1080,
    "couleur": "#685848",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoYAA4APtFUo0uoJKMhsAgBABoJQBOmUGSxh1w/kbHQgADqptoOxMzrEU556znPanwfbSmQAx2BVRcpxEAN3chFOL05O/dAAAA="
  },
  "les-terrasses-du-canal-02": {
    "width": 1920,
    "height": 2400,
    "couleur": "#181818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAABQBQCdASoYAB4APtFcpkyoJSOiMAgBABoJZwDMWCPoI0nW6iPOAq3Qwx6lNZKHME033QIA/rvA+a1sGMoqRqTCExGy9n+tL2unqJxnZdXBGEt0ZM6DxhXkqqn/GEkMqoKN3TY+V/m5OS7bpfdYd/Iu4wd9G99bkKj2SDS7UpzIpI+MXUEoAAAA"
  },
  "les-terrasses-du-canal-03": {
    "width": 1920,
    "height": 1280,
    "couleur": "#685848",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADQAwCdASoYABAAPtFYpEwoJSOiMAgBABoJYwC7ACHW+3nN40DhmGAA/s1PAgudkkuUcVaEUnNerh6mvLsJZMe4pAL7ulL3zdGunSTmoBScwAAA"
  },
  "les-terrasses-du-canal-04": {
    "width": 1440,
    "height": 1440,
    "couleur": "#785848",
    "largeurs": [
      480,
      800,
      960,
      1440
    ],
    "lqip": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAAAQBACdASoYABgAPtFWpUwoJKOiKA1RABoJZwDMHHGKgiM8tMDxjpSMAAD7jqIgLP8V+sf8kv2n369UtuWje6T9aY4/XRnqm3gC1AKNLIlWIy7c72fhwSpQgAA="
  },
  "les-terrasses-du-canal-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#988888",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAAAQAwCdASoYABAAPtFUo0uoJKMhsAgBABoJZ2fkRgATx+AA/tm5VFzXUg/n4Gab/DPEtxD4BzLyptm39vtGAAAA"
  },
  "les-terrasses-du-canal-06": {
    "width": 1920,
    "height": 1080,
    "couleur": "#f8f8e8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAADQAwCdASoYAA4APtFWpEuoJKOhsAgBABoJQBUeg9GOnjC/i0DJ+YAA/tHoxTofJS6I/nrMbAmol3lNKA4SdxZ8MmiEiD0KGF/3g/YnX+Bk9LLghvT28r/XfFL1o8bkrSGNAAAA"
  },
  "les-terrasses-du-canal-07": {
    "width": 1920,
    "height": 2400,
    "couleur": "#c8c8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpoAAABXRUJQVlA4II4AAABwBQCdASoYAB4APtFapkuoJaOhqA1RABoJZwDE33phLKz8Dlk9yvp/98mi5ezKaGAfLOTAAP4ZOQLLMc4MARH2j9FEIu/2rzIvXPswAeXEmrIWn1SEEMOd4h5EllgK/RyRLZhsUMRmn5cMT97ONidWuCnd4O3oUUMrSwXV8m/LgcGcmQ0rF9ilKLgDAAAA"
  },
  "les-terrasses-du-canal-08": {
    "width": 1920,
    "height": 1280,
    "couleur": "#e8e8d8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAADwAwCdASoYABAAPtFYpEuoJSOhsAgBABoJYwCw7B6GjcPk7kc0jihoAN41G0Zpw6OodDM0EmKgtNkC8zSrz4bCsh25tFhmztZHzOEqoqL+ZO52NHEAFVgNeVJXeupD/PAAAA=="
  },
  "lumiere-fossile-01": {
    "width": 1920,
    "height": 1280,
    "couleur": "#282828",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRkIAAABXRUJQVlA4IDYAAADwAgCdASoYABAAPtFUo0uoJKMisAgBABoJZ2kfADdYAAD+74OXet3Vg8wJav+jp31reqtfAAA="
  },
  "lumiere-fossile-02": {
    "width": 1920,
    "height": 2400,
    "couleur": "#080808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADwAwCdASoYAB4APrlKnUunJCKht+gA4BcJQBbfZficsNgOGU/SwboAAP72iFJgm1u04ql2ukzbBf4HsMsQxOEfSKbKoFFHRrYNs8lpSQANAAAA"
  },
  "lumiere-fossile-03": {
    "width": 1920,
    "height": 1080,
    "couleur": "#080808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAABwAwCdASoYAA4APtFWo0uoJKMhsAgBABoJZwAAW7W7d4u+RIAA/vMzVN88OTf5vlxht77GJ4TY8qxWgofE47HebsOIbfQ1gfPpCzgFD/8gHAAA"
  },
  "lumiere-fossile-04": {
    "width": 1920,
    "height": 1920,
    "couleur": "#281818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRnQAAABXRUJQVlA4IGgAAAAQBQCdASoYABgAPrVKnUunJKMht+gA4BaJYwC1GuiE5X+R/Gu1v0eHw03bQb/O2PvAAP72iY9bEke7se1NhmpW1eZx4XwjkjdI7pEeIy4L4s9i+SpBNnKIZ0KS75HxklCDLMaewTVkAA=="
  },
  "lumiere-fossile-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#383828",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADQAwCdASoYABAAPtFWo0uoJKMhsAgBABoJZQCdACHfZmQrPPkHgIAA/tppiOY46ZTCW37wu+LYyfQ9AAA="
  },
  "lumiere-fossile-06": {
    "width": 1920,
    "height": 2400,
    "couleur": "#181818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwBACdASoYAB4APtFUpkuoJKOhqA1RABoJZQCuHBEcmiMw0UOkX1lk5ZuM/e2AAP7ymCb+/fb8wUDj6LLk96fsTiUJWQPMYH3BRzauB0PxrVWzy3xqIAAA"
  },
  "maison-des-vignes-01": {
    "width": 1920,
    "height": 1280,
    "couleur": "#786858",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAADwAwCdASoYABAAPtFUo0uoJKMhsAgBABoJZQCdMoADATxQ5GFkDToAAP6e6Uy47aa7vX4uydE/fXfwGhkhoAAA"
  },
  "maison-des-vignes-02": {
    "width": 1920,
    "height": 2400,
    "couleur": "#887868",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAAAQBQCdASoYAB4APtFapE0oJSOiMBgIAQAaCWUAuwANmdLZV6mG2FIg6HA7nB/fJHYgAMxrsSpKoWpJtatN2S0mXLaMCMhxP3SM3k07H8gkvh2vktXL6dsCWdTOxD1KBb/N9USRjRl5A6vod0KuCxvy9DFSJAmZnlzks0wA"
  },
  "maison-des-vignes-03": {
    "width": 1920,
    "height": 1080,
    "couleur": "#282818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAADwAwCdASoYAA4APtFWpUwoJKOiMAgBABoJQBadA3baTExEicA7GLc4AP7U+ZTRY+y5bIBx4DN8JPnqwtYbxjoXZzETugD/gwhhAopifuyaL2AOPlnKA0cz1zvA36qAAAA="
  },
  "maison-des-vignes-04": {
    "width": 1920,
    "height": 1280,
    "couleur": "#281808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAAAwBACdASoYABAAPtFUpEuoJKOhsAgBABoJQBOmUABp3Cg7EbZstTcUXAAA/vDTZaN3ORlJrKlhWPDcQuNrh8j/eBwScJ51CJt83Cd0vs5x0nsfCSpJoAAA"
  },
  "maison-des-vignes-05": {
    "width": 1920,
    "height": 1920,
    "couleur": "#285878",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAAAQBQCdASoYABgAPsFOn0unpCMht/qoAPAYCWMAvzgejJ/YuJFUk5pIOCUOk3C2NAsAAP7Ngv8T9uFvShNzzwi/9p7bT1jAB7arPeee5hQ5YhQuHskRb26dU2rZe6MgxgAAAA=="
  },
  "maison-des-vignes-06": {
    "width": 1920,
    "height": 1280,
    "couleur": "#b8b8a8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAABwAwCdASoYABAALplotFoiqCgoCACYSxgF2AIcr3IFeewMVQAA/t5/8yj04xXDw2xrJSTduuJuUBnYnUER71tJVceMrHnD/ySVlKQAAAA="
  },
  "maison-des-vignes-07": {
    "width": 960,
    "height": 1200,
    "couleur": "#6888a8",
    "largeurs": [
      480,
      800,
      960
    ],
    "lqip": "data:image/webp;base64,UklGRpIAAABXRUJQVlA4IIYAAABwBQCdASoYAB4APr1Qn0unJSMht/qoAOAXiUATplAAY3NdXz7nWmb4M6jBqyGaKEI5RQ0AAP6HZ2jKOnUApsFB2Jw+gSdCT1AUiPNq3H9m87ps6Y7WbGdlGkzbc59fgyqbZlLl8Zc7d4fVDPOU+JtC5TfAKmI5Jungu+gPBYM+3zzIDwAAAA=="
  },
  "maison-des-vignes-08": {
    "width": 1920,
    "height": 1080,
    "couleur": "#080808",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAAAwBACdASoYAA4APtFWo0uoJKMhsAgBABoJZACdMoMYAEZVSreNtAv7biAA/ieVG3AkAJZXKY32nGRMwTsSWQ1og3yb2Yrhy74qByZajkAFSHFsjq1/2/EsAAA="
  },
  "mediatheque-des-tanneurs-01": {
    "width": 1920,
    "height": 1280,
    "couleur": "#281818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAABQBACdASoYABAAPtFWpEuoJKOhsAgBABoJZQCw7CF58hokT6toprznjiIAAP7vCHQP9nosc/3leFnTidnscRYkjX4ioq/e6vjmqPieEIx+pdRa+DwAJjLwAAA="
  },
  "mediatheque-des-tanneurs-02": {
    "width": 1920,
    "height": 1080,
    "couleur": "#887868",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADwAwCdASoYAA4APtFWpEuoJKOhsAgBABoJYwC7AB5mnwA3jaRhvMoAAP0fgO/64M0uwY27V6OxAwEzEYa0V1uUczJFOcTQnYEyMZkTF4b5sngA"
  },
  "mediatheque-des-tanneurs-03": {
    "width": 1920,
    "height": 2400,
    "couleur": "#f8f8e8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRpIAAABXRUJQVlA4IIYAAABwBQCdASoYAB4APs1Uo0unpKMhsBgMAPAZiWMAnTNMQcOBJI6pi1/Xwp4o1DhrniSvx3o4AP3ilgu07T73xRXpQhUfFD20Zb0Dp/NuxRPh1W1g+6hk4wZDL8JpBth3GGWqSISph1+mxEzsCOp7V+31Xf/Rz445aFNt9GMOajC6QnnFsJPAAA=="
  },
  "mediatheque-des-tanneurs-04": {
    "width": 1920,
    "height": 1920,
    "couleur": "#c8a878",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAACwBACdASoYABgAPtFgqU+oJaOiKAgBABoJYwC3uA9rKUXHuyjHNrTOASLKP95kAP7nOxMBNjVVVDbP2mMQUmSqv79Riyj/WEVASZGFB2rZg2ls80UCuGNDS3FX0AWTR4AAAA=="
  },
  "mediatheque-des-tanneurs-05": {
    "width": 1920,
    "height": 1280,
    "couleur": "#989888",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAAAQBACdASoYABAAPtFUo0uoJKMhsAgBABoJYwCdACGsd6PVxo9A+SnZcAD8j4yL7+PZWmVjTUHVecnGS8DIyPHjcwiag+LRW0Wm9z9JYUhgRoMfCqTMBsiW0bEU+ylNoUQAAA=="
  },
  "mediatheque-des-tanneurs-06": {
    "width": 1920,
    "height": 2400,
    "couleur": "#c8c8b8",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRooAAABXRUJQVlA4IH4AAABQBQCdASoYAB4APtFepU6oJSMiKAqpABoJZwClrDTwp7i7MwdjtwM3kSV2UreYLPbBbwAA/u1OytVWgLTforpUqcvAaQv4OIjIyM7Q53Ho4zau3+C1dAV6EL0dKy/TaVxCQRm6U9F/9PJv0CinLom6jKub0a8sB3YcYYcEAAA="
  },
  "mediatheque-des-tanneurs-07": {
    "width": 1920,
    "height": 1080,
    "couleur": "#181818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAADwAwCdASoYAA4APtFYpEuoJSOhsAgBABoJZwCo9Bi9rp6E+M6WtMAAAP7u3nUmiCEx3P0x/wwagtUXfZ4s91akpmNIS2jkX7SZyvm3YRc91AWIH3ztvzCdRHAAAA=="
  },
  "mediatheque-des-tanneurs-08": {
    "width": 1920,
    "height": 1280,
    "couleur": "#887868",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAACwAwCdASoYABAAPtFUpEuoJKOhsAgBABoJYwCdMoADRoQ71/+qAAD+EPOHwnzD8c98mD38lXWWqqSiWgbMX1dlPfaxWCqZSmAAAA=="
  },
  "mediatheque-des-tanneurs-09": {
    "width": 1920,
    "height": 1920,
    "couleur": "#884818",
    "largeurs": [
      480,
      800,
      960,
      1440,
      1920
    ],
    "lqip": "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAABQBQCdASoYABgAPtFSoUyoJCMiMBgMAQAaCUAVgAGiEWhSUy+vrbnoX/XegPnVl2kGwdAA/l6WGgVPG4/96Ay1rIiH6+8odiZDyOwh3AHoUloWbecaK9U/2UZr9zv/Og/YtoEWx05R3zO2OoGBV29zVrEWi5scljp7GeAA"
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
