import rawData from '../data/countries.json'

export interface RestCountry {
  code: string
  name: string
  nameFr: string
  population: number
  area: number
  continent: string
  subregion: string
  flag: string
  lat: number
  lng: number
}

export async function getCountriesData(): Promise<RestCountry[]> {
  return rawData as RestCountry[]
}
