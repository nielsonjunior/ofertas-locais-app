import { randomBytes } from 'node:crypto'
import { del, put } from '@vercel/blob'
import { tokenDoBlob } from './_ambiente.js'
import type { Sql } from './_banco.js'
import { ErroDoCliente } from './_http.js'
import { extensao, tipoPelosBytes } from './_tipo.js'

/**
 * Fotos dos produtos. Ficam no Vercel Blob público — é vitrine, precisa abrir
 * rápido e ser compartilhada —, com nome aleatório, na pasta da loja, e
 * registradas na tabela fotos com a loja dona. O produto só aceita foto
 * registrada para a própria loja: nada de endereço de outro armazém (que o
 * golpista trocaria depois da aprovação) nem foto de outra loja.
 */

export const FOTOS_POR_PRODUTO = 5
/** Envios por loja por dia: um catálogo grande cabe; usar o site de depósito de imagem, não. */
const FOTOS_POR_DIA = 150

export async function guardarFoto(sql: Sql, lojaId: string, bytes: Buffer): Promise<string> {
  const tipo = tipoPelosBytes(bytes)
  if (!tipo || tipo === 'application/pdf') throw new ErroDoCliente('mande foto JPG, PNG ou WEBP')
  const [hoje] = await sql`select count(*)::int as total from fotos where loja_id = ${lojaId} and criada_em > now() - interval '1 day'`
  if (Number(hoje?.total) >= FOTOS_POR_DIA) throw new ErroDoCliente('limite de fotos de hoje atingido; tente amanhã', 429)
  const caminho = `produtos/${lojaId}/${randomBytes(12).toString('base64url')}.${extensao(tipo)}`
  const token = tokenDoBlob()
  if (!token) throw new Error('o armazém de fotos (Blob) não está ligado neste site; veja /api/saude')
  let guardada
  try {
    guardada = await put(caminho, bytes, { access: 'public', contentType: tipo, addRandomSuffix: false, token })
  } catch (erro) {
    // O motivo vai para a tela (sem token nem endereço): o erro mais comum é
    // o Blob ter sido criado como privado, e quem põe no ar precisa saber disso.
    console.error('o armazém recusou a foto', erro)
    const motivo = (erro instanceof Error ? erro.message : '').replace(/\S+:\/\/\S+/g, '').replace(/vercel_blob_rw_\S+/g, '').slice(0, 120)
    throw new ErroDoCliente(`o armazém de fotos recusou a foto${motivo ? `: ${motivo}` : ''}`, 503)
  }
  await sql`insert into fotos (url, loja_id) values (${guardada.url}, ${lojaId})`
  return guardada.url
}

/** As fotos que vieram com o produto, conferidas: de 1 a 5, todas registradas para esta loja. */
export async function fotosDaLoja(sql: Sql, lojaId: string, fotos: unknown): Promise<string[]> {
  if (!Array.isArray(fotos) || fotos.length === 0) throw new ErroDoCliente('ponha pelo menos uma foto')
  if (fotos.length > FOTOS_POR_PRODUTO) throw new ErroDoCliente(`no máximo ${FOTOS_POR_PRODUTO} fotos`)
  const urls = [...new Set(fotos.map((f) => String(f)))]
  if (urls.length !== fotos.length) throw new ErroDoCliente('foto repetida')
  const nossas = await sql`select url from fotos where loja_id = ${lojaId} and url = any(${urls})`
  if (nossas.length !== urls.length) throw new ErroDoCliente('foto inválida')
  return urls
}

/**
 * Apaga do armazém as fotos que nenhum produto da loja usa mais. Falha aqui
 * só vai para o log: a foto órfã custa espaço, não quebra nada.
 */
export async function apagarFotosSemUso(sql: Sql, lojaId: string, candidatas: string[]): Promise<void> {
  if (candidatas.length === 0) return
  const usadas = await sql`
    select distinct f as url from produtos p, jsonb_array_elements_text(p.fotos) f
     where p.loja_id = ${lojaId} and f = any(${candidatas})`
  const emUso = new Set(usadas.map((l) => String(l.url)))
  const soltas = candidatas.filter((u) => !emUso.has(u))
  if (soltas.length === 0) return
  await sql`delete from fotos where loja_id = ${lojaId} and url = any(${soltas})`
  await del(soltas, { token: tokenDoBlob() }).catch((e: unknown) => console.error('não apagou fotos do armazém', e))
}
