/**
 * Textes écrits par nous et pas encore validés par le label (Phase 7.6). Tant que le site est en
 * `noindex`, ils s'affichent avec la mention « brouillon » : c'est honnête, et c'est ce qui donne
 * au label la liste de ce qu'il lui reste à relire. **Le jour du domaine final, aucun visiteur ne
 * doit lire un marqueur de chantier** : `G2G_MASQUER_BROUILLONS=1` fait que ces textes ne sont pas
 * publiés du tout — ni leur mention, ni leur contenu. Les pages tiennent debout sans eux (une
 * section vide disparaît au lieu de laisser un titre orphelin), c'est vérifié par les planches du
 * bloc 7.6.
 */
export const MASQUER_BROUILLONS = process.env.G2G_MASQUER_BROUILLONS === '1'
