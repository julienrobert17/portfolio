/**
 * Relevé du registre et écriture d'un seul champ (Phase 7.7). Toute écriture en base passe par
 * ici : relevé avant, mutation d'un champ, relevé après, et retour arrière possible par la même
 * commande. Rien ne s'exécute sans l'argument final.
 *
 *   npx sanity exec outils/registre-releve.ts --with-user-token            (relevé seul)
 *   npx sanity exec outils/registre-releve.ts --with-user-token -- ecrire  (vide le champ)
 *   npx sanity exec outils/registre-releve.ts --with-user-token -- revenir (retour arrière)
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient({ apiVersion: '2024-10-01' })
const ID = 'soiree-2025-02-07'
const action = process.argv[process.argv.length - 1]

async function releve(etiquette: string) {
  const types = await client.fetch<string[]>(`*[!(_id in path("drafts.**"))]._type`)
  const comptes: Record<string, number> = {}
  for (const t of types) comptes[t] = (comptes[t] ?? 0) + 1
  comptes['TOTAL publiés'] = types.length
  comptes['brouillons'] = await client.fetch<number>(`count(*[_id in path("drafts.**")])`)
  const doc = await client.fetch<{ _rev?: string; lieu?: string; date?: string; verifiee?: boolean } | null>(
    `*[_id==$id][0]{_rev, date, lieu, verifiee}`, { id: ID },
  )
  const brouillon = await client.fetch<unknown>(`*[_id==$id][0]{_rev, lieu}`, { id: 'drafts.' + ID })
  console.log(`\n— ${etiquette} —`)
  console.log('comptes :', JSON.stringify(comptes))
  console.log('document :', JSON.stringify(doc))
  console.log('brouillon :', JSON.stringify(brouillon))
  return doc
}

async function main() {
  const avant = await releve('avant')
  if (action === 'ecrire') {
    if (!avant?._rev) throw new Error('document introuvable')
    const res = await client
      .patch(ID, { unset: ['lieu'], ifRevisionID: avant._rev })
      .commit({ visibility: 'sync' })
    console.log('écriture faite, nouvelle révision', res._rev)
    await releve('après')
  } else if (action === 'revenir') {
    const res = await client.patch(ID, { set: { lieu: 'Lieu à vérifier' } }).commit({ visibility: 'sync' })
    console.log('retour arrière fait, révision', res._rev)
    await releve('après retour arrière')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
