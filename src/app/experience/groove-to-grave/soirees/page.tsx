import type { Metadata } from 'next'
import { soireesAVenir, soireesPassees } from '@/components/experience/groove-to-grave/content'
import { label } from '@/components/experience/groove-to-grave/content/label'
import BlocSoirees from '@/components/experience/groove-to-grave/sections/bloc-soirees'
import Flyer from '@/components/experience/groove-to-grave/ui/flyer'

export const metadata: Metadata = {
  title: 'Soirées',
  description: `Les soirées de ${label.nom} à Paris : à venir et archive des flyers.`,
}

/** La page est régénérée chaque heure : une soirée passe en archive le lendemain sans changement de contenu. */
export const revalidate = 3600

/** À venir (billetterie externe) ou état vide, puis l'archive en mur de flyers réels. */
export default function SoireesPage() {
  const aVenir = soireesAVenir()
  const passees = soireesPassees()
  return (
    <>
      <section className="g2g-section" aria-labelledby="a-venir">
        <h1 id="a-venir" className="g2g-affiche g2g-titre">
          Soirées
        </h1>
        <BlocSoirees prochaine={aVenir[0]} />
        {aVenir.length > 1 ? (
          <ul className="g2g-flyers">
            {aVenir.slice(1).map((s) => (
              <li key={s.date}>
                <Flyer soiree={s} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="g2g-section" aria-labelledby="archive">
        <h2 id="archive" className="g2g-affiche">
          Archive
        </h2>
        <p className="g2g-sous">Les flyers tels quels, jamais recadrés, visuels LukasDarian quand il est crédité. Les dates sans source lisible restent à confirmer par le label.</p>
        <ul className="g2g-flyers">
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
