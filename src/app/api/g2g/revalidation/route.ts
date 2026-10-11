import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import { TAGS } from '@/components/experience/groove-to-grave/sanity/contenu'

interface Corps {
  _type?: string
  slug?: string
  date?: string
}

/**
 * Webhook de publication Sanity (Phase 7.3) : à chaque création, modification ou suppression
 * d'un document publié, Sanity envoie `{ _type, slug, date }` signé avec `SANITY_WEBHOOK_SECRET`
 * ; la route vérifie la signature puis revalide les tags du type (`g2g:sortie`), du document
 * (`g2g:sortie:gtgr05`) et de tout le site (`g2g`, pour le layout et les pages qui agrègent). Les
 * pages se regénèrent à la prochaine requête, sans rebuild.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ erreur: 'secret absent' }, { status: 500 })
  let corps: Awaited<ReturnType<typeof parseBody<Corps>>>
  try {
    corps = await parseBody<Corps>(req, secret)
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : 'corps illisible' }, { status: 400 })
  }
  if (!corps.isValidSignature) return NextResponse.json({ erreur: 'signature invalide' }, { status: 401 })
  const type = corps.body?._type
  if (!type) return NextResponse.json({ erreur: 'type absent' }, { status: 400 })
  const tags = new Set<string>([TAGS.tout, `g2g:${type}`])
  const cle = corps.body?.slug ?? corps.body?.date
  if (cle) tags.add(`g2g:${type}:${cle}`)
  for (const tag of tags) revalidateTag(tag, 'max')
  return NextResponse.json({ revalide: [...tags], quand: new Date().toISOString() })
}
