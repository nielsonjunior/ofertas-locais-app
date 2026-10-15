import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import { ErroDoCliente, parametro, responderErro, responderJson } from './_http.js'
import { cidades, ofertasDoPanfleto, ofertasValidas, panfletosValidos } from './_vitrine.js'
import { hojeEmCuiaba } from '../src/dominio/validade.js'

/**
 * O endereço /api/publico, que o site usa sem login. Só lê, e só o publicado.
 *
 *   GET ?acao=cidades
 *   GET ?acao=vitrine&cidade=caceres-mt   -> panfletos e ofertas valendo hoje
 *   GET ?acao=panfleto&id=…               -> um panfleto publicado, com as ofertas
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== 'GET') throw new ErroDoCliente('método não aceito', 405)
    const sql = await banco()
    const hoje = hojeEmCuiaba()
    // Um minuto de cache na borda: a vitrine muda pouco e o WhatsApp lê direto do banco.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')

    switch (parametro(req, 'acao')) {
      case 'cidades':
        responderJson(res, 200, await cidades(sql))
        return

      case 'vitrine': {
        const cidadeId = parametro(req, 'cidade')
        const cidade = (await cidades(sql)).find((c) => c.id === cidadeId)
        if (!cidade) throw new ErroDoCliente('cidade desconhecida', 404)
        const [panfletos, ofertas] = await Promise.all([
          panfletosValidos(sql, cidadeId, hoje),
          ofertasValidas(sql, cidadeId, hoje)
        ])
        responderJson(res, 200, { cidade, hoje, panfletos, ofertas })
        return
      }

      case 'panfleto': {
        const id = parametro(req, 'id')
        const [p] = await sql`
          select p.id, p.valido_de, p.valido_ate, jsonb_array_length(p.paginas) as paginas,
                 m.id as mercado_id, m.nome as mercado_nome, m.endereco as mercado_endereco,
                 m.cidade_id
            from panfletos p join mercados m on m.id = p.mercado_id
           where p.id = ${id} and p.estado = 'publicado' and m.ativo`
        if (!p) throw new ErroDoCliente('panfleto não encontrado', 404)
        responderJson(res, 200, {
          id: String(p.id),
          cidadeId: String(p.cidade_id),
          mercadoNome: String(p.mercado_nome),
          mercadoEndereco: String(p.mercado_endereco),
          validoDe: String(p.valido_de),
          validoAte: String(p.valido_ate),
          vencido: String(p.valido_ate) < hoje,
          paginas: Number(p.paginas),
          ofertas: await ofertasDoPanfleto(sql, id)
        })
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
