import type { GuessResult, NumericResult, Direction, NumericCell } from '@/lib/geodatle-game'

interface GuessRowProps {
  guess: GuessResult
  index: number
}

type CellValue = 'correct' | 'wrong' | 'unknown' | NumericCell

function cellStyle(value: CellValue): { bg: string; icon: string; color?: string } {
  if (value === 'unknown') return { bg: 'rgba(255,255,255,0.08)', icon: '?', color: 'rgba(255,255,255,0.4)' }
  if (value === 'correct') return { bg: '#16a34a', icon: '✓' }
  if (value === 'wrong')   return { bg: '#dc2626', icon: '✗' }
  const bgMap: Record<NumericResult, string> = { similar: '#16a34a', close: '#ca8a04', far: '#dc2626' }
  const iconMap: Record<Direction, string>   = { up: '↑', down: '↓', none: '✓' }
  return { bg: bgMap[value.result], icon: iconMap[value.direction] }
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

export default function GuessRow({ guess, index }: GuessRowProps) {
  const { name, flag, values, results } = guess

  const cells: { key: string; value: CellValue; display: string }[] = [
    { key: 'continent',      value: results.continent,      display: fmt('continent',      values.continent)      },
    { key: 'population',     value: results.population,     display: fmt('population',     values.population)     },
    { key: 'area',           value: results.area,           display: fmt('area',           values.area)           },
    { key: 'poverty',        value: results.poverty,        display: fmt('poverty',        values.poverty)        },
    { key: 'lifeExpectancy', value: results.lifeExpectancy, display: fmt('lifeExpectancy', values.lifeExpectancy) },
    { key: 'meatSupply',     value: results.meatSupply,     display: fmt('meatSupply',     values.meatSupply)     },
    { key: 'co2PerCapita',   value: results.co2PerCapita,   display: fmt('co2PerCapita',   values.co2PerCapita)   },
    { key: 'fertilityRate',  value: results.fertilityRate,  display: fmt('fertilityRate',  values.fertilityRate)  },
  ]

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
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'white' }}>{name}</span>
        </div>
      </td>

      {cells.map(({ key, value, display }, colIndex) => {
        const { bg, icon, color } = cellStyle(value)
        return (
          <td
            key={key}
            className="animate-[fadeFlip_0.4s_ease-out_both]"
            style={{
              backgroundColor: bg,
              borderRadius: '6px',
              padding: '5px 4px',
              fontSize: '11px',
              fontWeight: 600,
              color: color ?? 'white',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              animationDelay: `${index * 80 + (colIndex + 1) * 120}ms`,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3 }}>
              <span>{display}</span>
              <span>{icon}</span>
            </div>
          </td>
        )
      })}
    </tr>
  )
}
