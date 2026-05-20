import type { GuessResult } from '@/lib/countryle-game'

interface GuessRowProps {
  guess: GuessResult
  index: number
}


type CellResult = 'correct' | 'wrong' | 'higher' | 'lower' | 'unknown'

const CELL_CONFIG: Record<CellResult, { bg: string; icon: string; color?: string }> = {
  correct: { bg: '#16a34a', icon: '✓' },
  wrong:   { bg: '#dc2626', icon: '✗' },
  higher:  { bg: '#ea580c', icon: '↑' },
  lower:   { bg: '#ea580c', icon: '↓' },
  unknown: { bg: 'rgba(255,255,255,0.08)', icon: '?', color: 'rgba(255,255,255,0.4)' },
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

  const cells: { key: string; result: CellResult; display: string; }[] = [
    { key: 'continent',      result: results.continent,      display: fmt('continent',      values.continent)      },
    { key: 'population',     result: results.population,     display: fmt('population',     values.population)     },
    { key: 'area',           result: results.area,           display: fmt('area',           values.area)           },
    { key: 'poverty',        result: results.poverty,        display: fmt('poverty',        values.poverty)        },
    { key: 'lifeExpectancy', result: results.lifeExpectancy, display: fmt('lifeExpectancy', values.lifeExpectancy) },
    { key: 'meatSupply',     result: results.meatSupply,     display: fmt('meatSupply',     values.meatSupply)     },
    { key: 'co2PerCapita',   result: results.co2PerCapita,   display: fmt('co2PerCapita',   values.co2PerCapita)   },
    { key: 'fertilityRate',  result: results.fertilityRate,  display: fmt('fertilityRate',  values.fertilityRate)  },
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

      {cells.map(({ key, result, display }, colIndex) => {
        const { bg, icon, color } = CELL_CONFIG[result]
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
