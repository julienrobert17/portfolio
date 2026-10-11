import { artiste } from './artiste'
import { typesCommuns } from './communs'
import { reglages, textes } from './label'
import { soiree } from './soiree'
import { piste, sortie } from './sortie'

export const schemaTypes = [...typesCommuns, piste, sortie, artiste, soiree, textes, reglages]

/** Documents uniques : un seul de chaque, jamais créés depuis « Nouveau ». */
export const typesUniques = ['textes', 'reglages']
