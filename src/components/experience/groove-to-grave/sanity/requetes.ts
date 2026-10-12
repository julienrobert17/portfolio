import { defineQuery } from 'next-sanity'

/**
 * Requêtes GROQ du site (Phases 7.3 et 7.4) : texte, structure et médias viennent de Sanity. Les
 * images optimisées (AVIF et WebP par largeur), les couleurs de cassette et les extraits traités
 * sont les champs en lecture seule remplis par le pipeline (scripts/g2g-pipeline-sanity.ts),
 * servis depuis le CDN Sanity. Les types de résultat sont générés par `sanity typegen`
 * (types.generated.ts).
 */
const IMAGE_OPTIMISEE = `{ largeur, hauteur, tailles[] { largeur, hauteur, "avif": avif.asset->url, "webp": webp.asset->url } }`

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
  pistes[] { position, titre, artiste, duree, bonusNumerique, "extrait": extraitTraite.asset->url, extraitDuree, bpm, extraitProvisoire },
  pochette { alt, credit, auteurNonIdentifie },
  "pochetteOptimisee": pochetteOptimisee ${IMAGE_OPTIMISEE},
  couleurs { dominante, accent, contrasteInkDominante, contrasteInkAccent, contrastePosterDominante, contrastePosterAccent }
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
  sources,
  portrait { alt, credit, auteurNonIdentifie },
  "portraitOptimise": portraitOptimise ${IMAGE_OPTIMISEE}
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
  "flyerOptimise": flyerOptimise ${IMAGE_OPTIMISEE},
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
