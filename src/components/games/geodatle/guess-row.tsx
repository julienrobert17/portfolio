import type { GuessResult, NumericResult, Direction, NumericCell } from '@/lib/geodatle-game'
import { useLang } from '@/components/games/geodatle/lang-context'

interface GuessRowProps {
  guess: GuessResult
  index: number
  unavailableIndicators?: Set<string>
}

type CellValue = 'correct' | 'wrong' | 'unknown' | NumericCell

const INDICATOR_ICONS: Record<string, string> = {
  continent:      '🌍',
  population:     '👥',
  area:           '🗺️',
  poverty:        '🪙',
  lifeExpectancy: '❤️',
  meatSupply:     '🥩',
  co2PerCapita:   '🌿',
  fertilityRate:  '👶',
}

function cellBg(value: CellValue): string {
  if (value === 'unknown') return 'rgba(255,255,255,0.08)'
  if (value === 'correct') return '#16a34a'
  if (value === 'wrong')   return '#dc2626'
  const bgMap: Record<NumericResult, string> = { similar: '#16a34a', close: '#ca8a04', far: '#dc2626' }
  return bgMap[value.result]
}

function resultIcon(value: CellValue): string {
  if (value === 'unknown') return '?'
  if (value === 'correct') return '✓'
  if (value === 'wrong')   return '✗'
  if (value.result === 'similar') return '≈'
  const dirMap: Record<Direction, string> = {
    up:   value.result === 'close' ? '↑'  : '↑↑',
    down: value.result === 'close' ? '↓'  : '↓↓',
    none: '≈',
  }
  return dirMap[value.direction]
}

function fmt(key: string, value: number | string | null): string {
  if (value === null) return '?'
  if (typeof value === 'string') return value
  switch (key) {
    case 'population': return `${(value / 1_000_000).toFixed(1)}M`
    case 'area':       return `${Math.round(value / 1_000)}k`
    case 'poverty':    return value === 0 ? '<0.1%' : value.toFixed(2) + '%'
    default:           return value.toFixed(1)
  }
}

export default function GuessRow({ guess, index, unavailableIndicators = new Set() }: GuessRowProps) {
  const { lang } = useLang()
  const { name, nameFr, flag, values, results } = guess
  const displayName = lang === 'fr' ? nameFr : name

  const cells: { key: string; value: CellValue; display: string }[] = [
    { key: 'continent',      value: results.continent,      display: fmt('continent',      values.continent)      },
    { key: 'population',     value: results.population,     display: fmt('population',     values.population)     },
    { key: 'area',           value: results.area,           display: fmt('area',           values.area)           },
    { key: 'poverty',        value: results.poverty,        display: fmt('poverty',        values.poverty)        },
    { key: 'lifeExpectancy', value: results.lifeExpectancy, display: fmt('lifeExpectancy', values.lifeExpectancy) },
    { key: 'meatSupply',     value: results.meatSupply,     display: fmt('meatSupply',     values.meatSupply)     },
    { key: 'co2PerCapita',   value: results.co2PerCapita,   display: fmt('co2PerCapita',   values.co2PerCapita)   },
    { key: 'fertilityRate',  value: results.fertilityRate,  display: fmt('fertilityRate',  values.fertilityRate)  },
  ].filter(c => !unavailableIndicators.has(c.key))

  return (
    <tr>
      <td
        style={{
          width: '120px',
          padding: '5px 6px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          animationDelay: `${index * 80}ms`,
        }}
        className="animate-[fadeFlip_0.4s_ease-out_both]"
      >
        <div className="flex items-center gap-2 whitespace-nowrap">
          <img src={flag} alt="" style={{ width: '24px', height: '16px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'white' }}>{displayName}</span>
        </div>
      </td>

      {cells.map(({ key, value, display }, colIndex) => (
        <td
          key={key}
          className="animate-[fadeFlip_0.4s_ease-out_both]"
          style={{
            backgroundColor: cellBg(value),
            borderRadius: '8px',
            padding: '8px 5px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            animationDelay: `${index * 80 + (colIndex + 1) * 120}ms`,
            flex: 1,
            minWidth: '52px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{INDICATOR_ICONS[key] ?? ''}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'white', lineHeight: 1 }}>{display}</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{resultIcon(value)}</span>
          </div>
        </td>
      ))}
    </tr>
  )
}
