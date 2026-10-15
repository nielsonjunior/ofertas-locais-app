import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import type { Sql } from './_banco.js'
import { ErroDoCliente, lerBytes, parametro, responderErro, responderJson } from './_http.js'
import { cidades, ofertasValidas, panfletosValidos } from './_vitrine.js'
import { assinaturaValida, enviarTexto, mensagensRecebidas } from './_whatsapp.js'
import type { Recebida } from './_whatsapp.js'
import { responder } from '../src/dominio/conversa.js'
import type { Contato, Contexto } from '../src/dominio/conversa.js'
import { hojeEmCuiaba } from '../src/dominio/validade.js'

/**
 * O webhook do WhatsApp Business Cloud API.
 *
 *   GET  — a Meta confere que o endereço é nosso (hub.verify_token)
 *   POST — chegou mensagem; corpo assinado com o segredo do app
 *
 * Depois de conferida a assinatura, responde sempre 200: erro ao responder
 * uma pessoa fica no log, e a Meta não reenvia o lote inteiro por causa dela.
 */

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

async function atender(sql: Sql, msg: Recebida, siteUrl: string): Promise<void> {
  // A Meta reenvia quando demoramos: a mesma mensagem só é respondida uma vez.
  const nova = await sql`insert into mensagens_vistas (id) values (${msg.id}) on conflict do nothing returning id`
  if (nova.length === 0) return

  const [linha] = await sql`select wa_id, cidade_id from contatos where wa_id = ${msg.de}`
  const contato: Contato | null = linha ? { waId: String(linha.wa_id), cidadeId: linha.cidade_id ? String(linha.cidade_id) : null } : null

  const hoje = hojeEmCuiaba()
  const todas = await cidades(sql)
  const cidadeId = contato?.cidadeId && todas.some((c) => c.id === contato.cidadeId) ? contato.cidadeId : null
  const [panfletos, ofertas] = cidadeId
    ? await Promise.all([panfletosValidos(sql, cidadeId, hoje), ofertasValidas(sql, cidadeId, hoje)])
    : [[], []]

  const ctx: Contexto = { cidades: todas, panfletos, ofertas, siteUrl }
  const resultado = responder(contato, msg.texto, ctx, msg.de)

  if (resultado.contato) {
    await sql`insert into contatos (wa_id, cidade_id, atualizado_em) values (${msg.de}, ${resultado.contato.cidadeId}, now())
              on conflict (wa_id) do update set cidade_id = excluded.cidade_id, atualizado_em = now()`
  } else {
    await sql`delete from contatos where wa_id = ${msg.de}`
  }

  for (const texto of resultado.respostas) await enviarTexto(msg.de, texto)
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === 'GET') {
      const esperado = process.env.WHATSAPP_VERIFICACAO ?? ''
      if (parametro(req, 'hub.mode') !== 'subscribe' || !esperado || !iguais(parametro(req, 'hub.verify_token'), esperado)) {
        throw new ErroDoCliente('verificação não confere', 403)
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end(parametro(req, 'hub.challenge'))
      return
    }

    if (req.method !== 'POST') throw new ErroDoCliente('método não aceito', 405)

    const corpo = await lerBytes(req, 1024 * 1024)
    const assinatura = req.headers['x-hub-signature-256']
    if (!assinaturaValida(corpo, typeof assinatura === 'string' ? assinatura : undefined, process.env.WHATSAPP_SEGREDO_APP ?? '')) {
      throw new ErroDoCliente('assinatura não confere', 401)
    }

    let aviso: unknown
    try {
      aviso = JSON.parse(corpo.toString('utf8'))
    } catch {
      throw new ErroDoCliente('aviso ilegível')
    }

    const sql = await banco()
    const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '')
    for (const msg of mensagensRecebidas(aviso)) {
      try {
        await atender(sql, msg, siteUrl)
      } catch (erro) {
        console.error('não consegui responder a mensagem', msg.id, erro)
      }
    }
    await sql`delete from mensagens_vistas where em < now() - interval '7 days'`
    responderJson(res, 200, { ok: true })
  } catch (erro) {
    responderErro(res, erro)
  }
}
