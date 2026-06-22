import { writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import countries from 'world-countries'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

async function fetchPopulationMap() {
  const res = await fetch(
    'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=300&mrv=1',
  )
  if (!res.ok) throw new Error(`World Bank population fetch failed: ${res.status}`)

  const [meta, data] = await res.json()
  console.log(`Population entries received: ${data?.length ?? 0} (total: ${meta?.total ?? '?'})`)

  const map = new Map()
  for (const entry of data ?? []) {
    if (entry.countryiso3code?.length === 3 && entry.value != null) {
      map.set(entry.countryiso3code, entry.value)
    }
  }
  return map
}

async function main() {
  console.log('Fetching population data from World Bank...')
  const popMap = await fetchPopulationMap()

  const result = countries
    .filter((c) => (popMap.get(c.cca3) ?? 0) > 1_000_000)
    .map((c) => ({
      code: c.cca3,
      name: c.name.common,
      nameFr: c.translations?.fra?.common ?? c.name.common,
      population: Math.round((popMap.get(c.cca3) ?? 0) / 1000) * 1000,
      area: Math.round(c.area ?? 0),
      continent: c.region,
      subregion: c.subregion ?? '',
      flag: `https://flagcdn.com/${c.cca2.toLowerCase()}.svg`,
      lat: c.latlng?.[0] ?? 0,
      lng: c.latlng?.[1] ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const outDir = join(ROOT, 'src', 'data')
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'countries.json'), JSON.stringify(result, null, 2))

  console.log(`Done — ${result.length} countries written to src/data/countries.json`)
  console.log('Sample:', JSON.stringify(result.slice(0, 2), null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
