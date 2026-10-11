import { defineQuery } from 'next-sanity'

/**
 * Requêtes GROQ du site (Phase 7.3) : le texte et la structure viennent de Sanity, les images et
 * les extraits gardent leurs chemins sous public/experience/groove-to-grave/, retrouvés par la
 * clé stable de chaque document (référence de sortie, date ISO de soirée, slug d'artiste). Les
 * types de résultat sont générés par `sanity typegen` (types.generated.ts).
 */
export const REQUETE_SORTIES = defineQuery(`*[_type == "sortie"] | order(dateSortie desc) {
  _id,
  catalogue,
  "ref": slug.current,
  titre,
  genre,
  "artisteSlug": artiste->slug.current,
  nomArtiste,
  dateSortie,
  statut,
  sansRepress,
  genres,
  genresValides,
  texte { langue, corps, aValiderParLeLabel },
  credits { artwork, mastering, distribution, ar },
  aVerifier,
  bandcamp,
  boutiques[] { libelle, url },
  sources,
  pistes[] { position, titre, artiste, duree, bonusNumerique }
}`)

export const REQUETE_ARTISTES = defineQuery(`*[_type == "artiste"] | order(ordre asc, nom asc) {
  _id,
  nom,
  "slug": slug.current,
  ville,
  role,
  presentation { langue, corps, aValiderParLeLabel },
  "sorties": sorties[]->slug.current,
  liens[] { libelle, url },
  sources
}`)

export const REQUETE_SOIREES = defineQuery(`*[_type == "soiree"] | order(date desc) {
  _id,
  date,
  nom,
  lieu,
  adresse,
  ville,
  horaires,
  lineup,
  statut,
  prix,
  billetterie,
  flyer { alt, credit, auteurNonIdentifie },
  description { langue, corps, aValiderParLeLabel },
  sources,
  verifiee
}`)

export const REQUETE_TEXTES = defineQuery(`*[_type == "textes"][0] {
  presentation { langue, corps, aValiderParLeLabel },
  phrase { langue, corps, aValiderParLeLabel },
  pourquoi { langue, corps, aValiderParLeLabel },
  demo { langue, corps, aValiderParLeLabel },
  soireesVide { langue, corps, aValiderParLeLabel },
  newsletter { langue, corps, aValiderParLeLabel },
  droits { langue, corps, aValiderParLeLabel }
}`)

export const REQUETE_REGLAGES = defineQuery(`*[_type == "reglages"][0] {
  nom,
  ville,
  depuis,
  distribution,
  contact,
  contactDemo,
  newsletter { active, fournisseur },
  "crew": crew[]->slug.current,
  reseaux[] { libelle, url },
  disquaires[] { libelle, url }
}`)
