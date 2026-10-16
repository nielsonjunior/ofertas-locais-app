import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import { freioPorEndereco } from './_contas.js'
import { ErroDoCliente, lerJson, parametro, responderErro, responderJson } from './_http.js'
import { cidades, feedDaCidade, lojaPublica, produtoPublico, produtosPublicos } from './_vitrine.js'
import { categoriaValida } from '../src/dominio/categorias.js'

/**
 * O endereço /api/publico, que o site usa sem login. Só lê o que está no ar,
 * e conta vistas, cliques e denúncias.
 *
 *   GET  ?acao=cidades
 *   GET  ?acao=feed&cidade=caceres-mt[&categoria=roupas]
 *   GET  ?acao=produto&id=…
 *   GET  ?acao=loja&id=…
 *   GET  ?acao=produtos&ids=a,b,c    (salvos: os que ainda estão no ar; até 200)
 *   POST ?acao=vistas    { ids: [...] }     (até 30 de uma vez)
 *   POST ?acao=clique    { id }             (tocou em "Chamar no WhatsApp")
 *   POST ?acao=denuncia  { produtoId, motivo }
 */

export const MOTIVOS_DE_DENUNCIA = ['golpe', 'proibido', 'preco-errado', 'ofensivo', 'outro'] as const

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const sql = await banco()
    const rota = `${req.method} ${parametro(req, 'acao')}`

    if (rota === 'GET feed' || rota === 'GET cidades') {
      // Um minuto na borda: o feed muda pouco a cada minuto e assim aguenta pico.
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=120')
    } else if (req.method === 'GET') {
      // Produto e loja: quase sem cache, para o que foi tirado do ar sumir logo
      // de quem recebeu o link.
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10')
    }

    switch (rota) {
      case 'GET cidades':
        responderJson(res, 200, await cidades(sql))
        return

      case 'GET feed': {
        const cidadeId = parametro(req, 'cidade')
        const cidade = (await cidades(sql)).find((c) => c.id === cidadeId)
        if (!cidade) throw new ErroDoCliente('cidade desconhecida', 404)
        const categoria = parametro(req, 'categoria')
        if (categoria && !categoriaValida(categoria)) throw new ErroDoCliente('categoria desconhecida')
        responderJson(res, 200, { cidade, produtos: await feedDaCidade(sql, cidadeId, categoria) })
        return
      }

      case 'GET produto': {
        const produto = await produtoPublico(sql, parametro(req, 'id'))
        if (!produto) throw new ErroDoCliente('produto não encontrado', 404)
        responderJson(res, 200, produto)
        return
      }

      case 'GET produtos': {
        const ids = [...new Set(parametro(req, 'ids').split(',').map((x) => x.trim()).filter(Boolean))].slice(0, 200)
        responderJson(res, 200, await produtosPublicos(sql, ids))
        return
      }

      case 'GET loja': {
        const loja = await lojaPublica(sql, parametro(req, 'id'))
        if (!loja) throw new ErroDoCliente('loja não encontrada', 404)
        responderJson(res, 200, loja)
        return
      }

      case 'POST vistas': {
        const corpo = await lerJson(req)
        await freioPorEndereco(sql, req, 'vistas', 300)
        const ids = Array.isArray(corpo.ids) ? [...new Set(corpo.ids.filter((x): x is string => typeof x === 'string'))].slice(0, 30) : []
        if (ids.length) await sql`update produtos set vistas = vistas + 1 where id = any(${ids}) and ativo and not removido`
        responderJson(res, 204, undefined)
        return
      }

      case 'POST clique': {
        const corpo = await lerJson(req)
        await freioPorEndereco(sql, req, 'clique', 60)
        await sql`update produtos set cliques = cliques + 1 where id = ${String(corpo.id ?? '')} and ativo and not removido`
        responderJson(res, 204, undefined)
        return
      }

      case 'POST denuncia': {
        const corpo = await lerJson(req)
        const motivo = String(corpo.motivo ?? '')
        if (!(MOTIVOS_DE_DENUNCIA as readonly string[]).includes(motivo)) throw new ErroDoCliente('escolha o motivo')
        await freioPorEndereco(sql, req, 'denuncia', 10)
        // Uma denúncia por produto por pessoa: repetir não aumenta o peso.
        await freioPorEndereco(sql, req, `denuncia-${String(corpo.produtoId ?? '').slice(0, 40)}`, 1, 'você já denunciou este produto; obrigado')
        const feita = await sql`
          insert into denuncias (id, produto_id, motivo)
          select ${randomBytes(9).toString('base64url')}, id, ${motivo} from produtos where id = ${String(corpo.produtoId ?? '')}
          returning id`
        if (feita.length === 0) throw new ErroDoCliente('produto não encontrado', 404)
        responderJson(res, 201, { ok: true })
        return
      }

      default:
        throw new ErroDoCliente('pedido desconhecido', 404)
    }
  } catch (erro) {
    res.setHeader('Cache-Control', 'no-store')
    responderErro(res, erro)
  }
}
