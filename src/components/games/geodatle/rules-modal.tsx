'use client'

import { useState, useEffect } from 'react'

interface RulesModalProps {
  onClose: () => void
}

const RULES = [
  'Un pays mystère est choisi chaque jour',
  'Tu as 8 tentatives pour le trouver',
  'Chaque guess révèle des indices sur 7 indicateurs',
  'Les couleurs indiquent à quel point tu es proche',
]

const COLORS = [
  { emoji: '🟢', label: 'Très proche',           detail: 'moins de 15%'            },
  { emoji: '🟡', label: 'Dans la bonne direction', detail: 'moins de 25%'           },
  { emoji: '🟠', label: 'Encore loin',             detail: 'plus de 25%'            },
  { emoji: '🔴', label: '✗ Mauvais continent',     detail: ''                       },
  { emoji: '⬜', label: 'Données non disponibles', detail: ''                       },
]

export default function RulesModal({ onClose }: RulesModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 16)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1d27',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '480px',
          width: '90%',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          color: 'white',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center' }}>
          Comment jouer 🌍
        </h2>

        <ol style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '0', listStyle: 'none', margin: 0 }}>
          {RULES.map((rule, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
              <span style={{ fontWeight: 700, color: '#534AB7', minWidth: '20px' }}>{i + 1}.</span>
              {rule}
            </li>
          ))}
        </ol>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {COLORS.map(({ emoji, label, detail }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{emoji}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
              {detail && (
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{detail}</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            background: '#534AB7',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            padding: '12px 32px',
            fontWeight: 500,
            fontSize: '15px',
            cursor: 'pointer',
            alignSelf: 'center',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          C&apos;est parti !
        </button>
      </div>
    </div>
  )
}
