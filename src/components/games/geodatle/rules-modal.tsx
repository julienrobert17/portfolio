'use client'

import { useState, useEffect } from 'react'
import { useLang } from '@/components/games/geodatle/lang-context'

interface RulesModalProps {
  onClose: () => void
}

export default function RulesModal({ onClose }: RulesModalProps) {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 16)
    return () => clearTimeout(timer)
  }, [])

  const COLORS = [
    { emoji: '🟢', text: t.rules.colors.similar },
    { emoji: '🟡', text: t.rules.colors.close },
    { emoji: '🟠', text: t.rules.colors.far },
    { emoji: '🔴', text: t.rules.colors.wrong },
    { emoji: '⬜', text: t.rules.colors.na },
  ]

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
          maxHeight: '85dvh',
          overflowY: 'auto',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center' }}>
          {t.rules.title} 🌍
        </h2>

        <ol style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '0', listStyle: 'none', margin: 0 }}>
          {t.rules.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
              <span style={{ fontWeight: 700, color: '#534AB7', minWidth: '20px' }}>{i + 1}.</span>
              {item}
            </li>
          ))}
        </ol>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {COLORS.map(({ emoji, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{emoji}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Indicateurs
          </p>
          {[
            { icon: '🌍', label: 'Continent' },
            { icon: '👥', label: 'Population' },
            { icon: '🗺️', label: 'Superficie (km²)' },
            { icon: '🪙', label: 'Pauvreté extrême (%)' },
            { icon: '❤️', label: 'Espérance de vie (ans)' },
            { icon: '🥩', label: 'Viande (kg/an)' },
            { icon: '🌿', label: 'CO₂ par habitant (t/an)' },
            { icon: '👶', label: 'Taux de fertilité' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span style={{ fontSize: '16px', lineHeight: 1, width: '20px', textAlign: 'center' }}>{icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
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
          {t.rules.cta}
        </button>
      </div>
    </div>
  )
}
