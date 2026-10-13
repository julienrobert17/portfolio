import { useCallback, useMemo, useState } from 'react'
import { set, unset, type NumberInputProps } from 'sanity'

/**
 * Saisie d'une durée de piste (Phase 7.6). En base, le site stocke des **secondes** ; sur
 * l'étiquette d'un disque, une durée s'écrit `3:42`. Ce composant accepte les deux et ne change
 * rien au stockage : `3:42`, `3'42`, `1:02:30` ou `222` donnent tous un nombre de secondes.
 * La relecture en minutes et secondes est affichée sous le champ, pour qu'on vérifie d'un coup
 * d'œil ce qui a été compris.
 */
const FORMES = [
  /** 222 */
  { exp: /^(\d+)$/, secondes: (m: RegExpMatchArray) => Number(m[1]) },
  /** 3:42 ou 3'42 */
  { exp: /^(\d+)\s*[:'’]\s*([0-5]?\d)$/, secondes: (m: RegExpMatchArray) => Number(m[1]) * 60 + Number(m[2]) },
  /** 1:02:30 */
  { exp: /^(\d+)\s*[:'’]\s*([0-5]?\d)\s*[:'’]\s*([0-5]?\d)$/, secondes: (m: RegExpMatchArray) => Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) },
]

/** Secondes → `3:42`. */
export function enMinutes(secondes: number): string {
  const s = Math.max(0, Math.round(secondes))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + `:${String(r).padStart(2, '0')}`
}

/** Texte saisi → secondes, ou null si on ne sait pas lire. */
export function enSecondes(texte: string): number | null {
  const t = texte.trim()
  if (!t) return null
  for (const forme of FORMES) {
    const m = t.match(forme.exp)
    if (m) {
      const v = forme.secondes(m)
      return Number.isFinite(v) && v > 0 ? v : null
    }
  }
  return null
}

const STYLE_CHAMP: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 3,
  border: '1px solid var(--card-border-color, #ccc)',
  background: 'var(--card-bg-color, #fff)',
  color: 'var(--card-fg-color, inherit)',
  font: 'inherit',
}

export function SaisieDuree(props: NumberInputProps) {
  const { value, onChange, elementProps, readOnly } = props
  const [brouillon, setBrouillon] = useState<string | null>(null)
  const affiche = brouillon ?? (typeof value === 'number' ? enMinutes(value) : '')
  const lu = useMemo(() => (brouillon === null ? (typeof value === 'number' ? value : null) : enSecondes(brouillon)), [brouillon, value])
  const vide = (brouillon ?? '').trim() === '' && brouillon !== null

  const changer = useCallback(
    (texte: string) => {
      setBrouillon(texte)
      if (texte.trim() === '') {
        onChange(unset())
        return
      }
      const secondes = enSecondes(texte)
      if (secondes !== null) onChange(set(secondes))
    },
    [onChange],
  )

  return (
    <div>
      <input
        {...elementProps}
        type="text"
        inputMode="numeric"
        style={STYLE_CHAMP}
        value={affiche}
        readOnly={readOnly}
        placeholder="3:42"
        onChange={(e) => changer(e.currentTarget.value)}
        onBlur={(e) => {
          elementProps.onBlur?.(e)
          // Au départ du champ, on réaffiche ce qui a été compris plutôt que ce qui a été tapé.
          setBrouillon(null)
        }}
      />
      <div style={{ marginTop: 6, fontSize: 13 }}>
        {lu !== null ? (
          <span style={{ opacity: 0.7 }}>
            {enMinutes(lu)} — {lu} secondes enregistrées
          </span>
        ) : vide ? (
          <span style={{ opacity: 0.7 }}>Durée vide : elle est obligatoire.</span>
        ) : (
          <span style={{ color: 'var(--card-badge-critical-fg-color, #c00)' }}>
            Durée incomprise. Écrivez-la comme sur l'étiquette, par exemple 3:42, ou en secondes, par exemple 222.
          </span>
        )}
      </div>
    </div>
  )
}
