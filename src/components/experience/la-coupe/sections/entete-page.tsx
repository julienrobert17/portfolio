import styles from './entete-page.module.css'

interface EntetePageProps {
  surtitre: string
  titre: string
  intro?: string
}

/** Entête commune des pages intérieures : surtitre mono, titre display, intro optionnelle. */
export default function EntetePage({ surtitre, titre, intro }: EntetePageProps) {
  return (
    <header className={`lc-container ${styles.entete}`}>
      <p className="lc-mono lc-muted">{surtitre}</p>
      <h1 className="lc-display lc-h1">{titre}</h1>
      {intro ? <p className={`lc-lead ${styles.intro}`}>{intro}</p> : null}
    </header>
  )
}
