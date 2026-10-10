import type { Metadata } from 'next'
import { soireesAVenir, soireesPassees } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import HerosSoiree from '@/components/experience/groove-to-grave/sections/heros-soiree'
import Flyer from '@/components/experience/groove-to-grave/ui/flyer'
import TitrePage from '@/components/experience/groove-to-grave/ui/titre-page'

export const metadata: Metadata = {
  title: 'Soirées',
  description: `Les soirées de ${label.nom} à Paris : à venir et archive des flyers.`,
}

/** La page est régénérée chaque heure : une soirée passe en archive le lendemain sans changement de contenu. */
export const revalidate = 3600

/** La soirée à venir en héros, ou l'état vide, puis l'archive en mur de flyers réels. */
export default function SoireesPage() {
  const aVenir = soireesAVenir()
  const passees = soireesPassees()
  return (
    <>
      <section className="g2g-entete-page" aria-labelledby="soirees">
        <TitrePage id="soirees" texte="Soirées" teinte="rouge">
          Soirées
        </TitrePage>
        <HerosSoiree prochaine={aVenir[0]} />
        {aVenir.length > 1 ? (
          <ul className="g2g-flyers" style={{ marginTop: 'var(--s4)' }}>
            {aVenir.slice(1).map((s) => (
              <li key={s.date}>
                <Flyer soiree={s} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="g2g-section" aria-labelledby="archive">
        <h2 id="archive" className="g2g-affiche g2g-titre-section">
          Archive
        </h2>
        <p>Les flyers tels quels, jamais recadrés, visuels LukasDarian quand il est crédité. Les dates sans source lisible restent à confirmer par le label.</p>
        <ul className="g2g-flyers" style={{ marginTop: 'var(--s4)' }}>
          {passees.map((s) => (
            <li key={s.date}>
              <Flyer soiree={s} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
