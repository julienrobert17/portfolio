import guide from '../../docs/groove-to-grave/guide-label.md?raw'

/**
 * Le guide du label, dans le Studio (Phase 7.5). Le texte n'est pas recopié ici : il est lu tel
 * quel dans `docs/groove-to-grave/guide-label.md`, pour qu'il n'en existe qu'une version. Rendu
 * sans dépendance : titres, paragraphes, listes et tableau, dans les couleurs du Studio.
 */
const STYLE_CODE: React.CSSProperties = { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '0.9em', opacity: 0.9 }

/** Gras et code en Markdown, sans bibliothèque : le guide n'utilise rien de plus. */
function Ligne({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((m, i) =>
        m.startsWith('**') ? <strong key={i}>{m.slice(2, -2)}</strong> : m.startsWith('`') ? <code key={i} style={STYLE_CODE}>{m.slice(1, -1)}</code> : <span key={i}>{m}</span>,
      )}
    </>
  )
}

export function Guide() {
  return (
    <div style={{ padding: '32px 24px 64px', maxWidth: 760, margin: '0 auto', lineHeight: 1.6 }}>
      {guide.split('\n').map((ligne, i) => {
        if (ligne.startsWith('# ')) return <h1 key={i} style={{ fontSize: 24, marginTop: 0 }}>{ligne.slice(2)}</h1>
        if (ligne.startsWith('## ')) return <h2 key={i} style={{ fontSize: 18, marginTop: 32 }}>{ligne.slice(3)}</h2>
        if (ligne.startsWith('---')) return <hr key={i} style={{ border: 0, borderTop: '1px solid currentColor', opacity: 0.2, margin: '24px 0' }} />
        if (ligne.startsWith('| ')) {
          const cellules = ligne.split('|').slice(1, -1).map((c) => c.trim())
          if (cellules.every((c) => /^-+$/.test(c))) return null
          return (
            <p key={i} style={{ margin: '6px 0', paddingLeft: 12, borderLeft: '3px solid currentColor' }}>
              <strong>{cellules[0]}</strong>
              {cellules.length > 1 ? ' — ' : ''}
              <Ligne texte={cellules.slice(1).join(' · ')} />
            </p>
          )
        }
        if (ligne.startsWith('- ')) return <li key={i} style={{ margin: '4px 0 4px 18px' }}><Ligne texte={ligne.slice(2)} /></li>
        if (!ligne.trim()) return null
        return <p key={i} style={{ margin: '12px 0' }}><Ligne texte={ligne} /></p>
      })}
    </div>
  )
}
