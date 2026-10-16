import type { IncomingMessage, ServerResponse } from 'node:http'
import { list } from '@vercel/blob'
import { conferirAdmin, tokenDoBlob, urlDoBanco } from './_ambiente.js'
import { banco } from './_banco.js'
import { responderJson } from './_http.js'

/**
 * O endereço /api/saude: diz o que está ligado neste site — banco, fotos,
 * administrador — para quem está pondo no ar descobrir o que falta. Nunca
 * mostra senha, token nem endereço do banco; só "ok", "faltando" ou o tipo
 * do erro.
 */

/** Mensagem de erro curta e sem nada que pareça endereço ou senha. */
function semSegredo(erro: unknown): string {
  const texto = erro instanceof Error ? erro.message : String(erro)
  return texto.replace(/\S+:\/\/\S+/g, '[endereço]').replace(/vercel_blob_rw_\S+/g, '[token]').slice(0, 160)
}

async function conferirBanco(): Promise<string> {
  if (!urlDoBanco()) return 'faltando: conecte o Neon ao projeto (Storage) ou ponha DATABASE_URL, e faça Redeploy'
  try {
    const sql = await banco()
    const [linha] = await sql`select count(*)::int as total from cidades`
    return `ok (${linha?.total ?? 0} cidades)`
  } catch (erro) {
    return `erro: ${semSegredo(erro)}`
  }
}

async function conferirFotos(): Promise<string> {
  const token = tokenDoBlob()
  if (!token) return 'faltando: crie o Blob (Storage), conecte ao projeto e faça Redeploy'
  try {
    await list({ limit: 1, token })
    return 'ok (confira que o Blob foi criado como Public)'
  } catch (erro) {
    return `erro: ${semSegredo(erro)}`
  }
}

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const [bancoDeDados, fotos] = await Promise.all([conferirBanco(), conferirFotos()])
  const site = process.env.SITE_URL ? `ok (${process.env.SITE_URL})` : 'faltando (só o robô do WhatsApp usa)'
  const pronto = bancoDeDados.startsWith('ok') && fotos.startsWith('ok') && conferirAdmin(process.env.ADMIN_INICIAL).startsWith('ok')
  responderJson(res, 200, {
    pronto,
    banco: bancoDeDados,
    fotos,
    admin: conferirAdmin(process.env.ADMIN_INICIAL),
    site
  })
}
