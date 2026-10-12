import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

/** Dépôt où tourne l'Action du pipeline (`.github/workflows/g2g-pipeline-medias.yml`). */
const DEPOT = 'julienrobert17/portfolio'
const EVENEMENT = 'g2g-medias'

interface Corps {
  _id?: string
  _type?: string
  cle?: string
}

/**
 * Relais du pipeline médias (bloc 7.4b) : Sanity appelle cette route dès qu'un fichier d'origine
 * change sur un document publié (filtre `delta::changedAny` sur pochette, flyer, portrait et
 * extraits bruts des pistes — jamais sur les champs que le pipeline écrit lui-même, sinon il
 * s'appellerait en boucle). La signature est vérifiée avec `SANITY_WEBHOOK_MEDIAS_SECRET` (à
 * défaut `SANITY_WEBHOOK_SECRET`), puis la route déclenche l'Action GitHub par
 * `repository_dispatch` de type `g2g-medias`, avec un jeton de portée minimale rangé dans les
 * variables d'environnement Vercel (`G2G_GITHUB_TOKEN`), jamais chez Sanity ni dans le dépôt.
 * Sans ce jeton, la route répond 503 : l'Action planifiée toutes les 15 minutes reste le filet.
 * Le site n'est pas revalidé ici : le pipeline patche les documents, et c'est la publication de
 * ces patches qui déclenche `/api/g2g/revalidation` comme pour tout changement de contenu.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const recu = new Date().toISOString()
  const secret = process.env.SANITY_WEBHOOK_MEDIAS_SECRET ?? process.env.SANITY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ erreur: 'secret absent' }, { status: 500 })
  let corps: Awaited<ReturnType<typeof parseBody<Corps>>>
  try {
    corps = await parseBody<Corps>(req, secret)
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : 'corps illisible' }, { status: 400 })
  }
  if (!corps.isValidSignature) return NextResponse.json({ erreur: 'signature invalide' }, { status: 401 })
  const jeton = process.env.G2G_GITHUB_TOKEN
  if (!jeton) return NextResponse.json({ erreur: 'G2G_GITHUB_TOKEN absent : pipeline laissé à l’Action planifiée', recu }, { status: 503 })
  const r = await fetch(`https://api.github.com/repos/${DEPOT}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jeton}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: EVENEMENT, client_payload: { document: corps.body?._id ?? null, type: corps.body?._type ?? null, recu } }),
  })
  if (!r.ok) return NextResponse.json({ erreur: `GitHub ${r.status}`, detail: (await r.text()).slice(0, 200), recu }, { status: 502 })
  return NextResponse.json({ declenche: EVENEMENT, document: corps.body?._id ?? null, recu, transmis: new Date().toISOString() })
}
