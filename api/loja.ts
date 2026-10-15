import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import { exigirConta } from './_contas.js'
import { fotosDaLoja, guardarFoto } from './_fotos.js'
import { ErroDoCliente, lerBytes, lerJson, parametro, responderErro, responderJson, textoDe } from './_http.js'
import { paraVitrine } from './_vitrine.js'
import { validarLoja, validarProduto } from '../src/dominio/cadastro.js'

/**
 * O endereço /api/loja: o painel do lojista. Tudo exige sessão de lojista, e
 * toda instrução filtra pela loja da sessão — o id que vem do navegador nunca
 * basta para mexer no produto de outra loja.
 *
 *   GET    ?acao=minha                      -> loja + produtos com vistas e cliques
 *   PUT    ?acao=loja       { nome, categoria, whatsapp, endereco, descricao }
 *   POST   ?acao=foto       corpo = a foto (até 4 MB) -> { url }
 *   POST   ?acao=produto    { titulo, descricao, categoria, preco, precoDe, fotos }
 *   PUT    ?acao=produto    { id, ...os mesmos }
 *   POST   ?acao=ativo      { id, ativo }
 *   DELETE ?acao=produto&id=
 */

const TAMANHO_DA_FOTO = 4 * 1024 * 1024
const PRODUTOS_POR_LOJA = 500

function validar<T>(fazer: () => T): T {
  try {
    return fazer()
  } catch (erro) {
    throw new ErroDoCliente((erro as Error).message)
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const { lojaId } = await exigirConta(req, 'lojista')
    const loja = lojaId!
    const sql = await banco()
    const rota = `${req.method} ${parametro(req, 'acao')}`

    switch (rota) {
      case 'GET minha': {
        const [l] = await sql`select id, cidade_id, nome, categoria, whatsapp, endereco, descricao, estado from lojas where id = ${loja}`
        if (!l) throw new ErroDoCliente('loja não encontrada', 404)
        const produtos = await sql`
          select p.id, p.titulo, p.descricao, p.categoria, p.preco, p.preco_de, p.fotos, p.criado_em, p.ativo, p.vistas, p.cliques,
                 l.id as loja_id, l.nome as loja_nome, l.whatsapp as loja_whatsapp
            from produtos p join lojas l on l.id = p.loja_id
           where p.loja_id = ${loja} order by p.criado_em desc`
        responderJson(res, 200, {
          loja: {
            id: l.id, cidadeId: l.cidade_id, nome: l.nome, categoria: l.categoria, whatsapp: l.whatsapp,
            endereco: l.endereco, descricao: l.descricao, estado: l.estado
          },
          produtos: produtos.map((p) => ({ ...paraVitrine(p), ativo: p.ativo, vistas: p.vistas, cliques: p.cliques }))
        })
        return
      }

      case 'PUT loja': {
        const corpo = await lerJson(req)
        const dados = validar(() => validarLoja(corpo))
        // Trocar nome ou WhatsApp de loja aprovada volta para análise: se a
        // conta for tomada, o golpista não troca o número e segue no ar. Loja
        // recusada que corrige os dados volta para a fila. Bloqueada fica bloqueada.
        await sql`
          update lojas set
            estado = case when estado = 'aprovada' and (nome <> ${dados.nome} or whatsapp <> ${dados.whatsapp}) then 'pendente'
                          when estado = 'recusada' then 'pendente' else estado end,
            nome = ${dados.nome}, categoria = ${dados.categoria}, whatsapp = ${dados.whatsapp},
            endereco = ${dados.endereco}, descricao = ${dados.descricao}
           where id = ${loja}`
        responderJson(res, 204, undefined)
        return
      }

      case 'POST foto': {
        const bytes = await lerBytes(req, TAMANHO_DA_FOTO)
        responderJson(res, 201, { url: await guardarFoto(loja, bytes) })
        return
      }

      case 'POST produto':
      case 'PUT produto': {
        const corpo = await lerJson(req)
        const p = validar(() => validarProduto(corpo))
        const fotos = JSON.stringify(fotosDaLoja(loja, corpo.fotos))
        if (req.method === 'POST') {
          const [conta] = await sql`select count(*)::int as total from produtos where loja_id = ${loja}`
          if (Number(conta?.total) >= PRODUTOS_POR_LOJA) throw new ErroDoCliente(`no máximo ${PRODUTOS_POR_LOJA} produtos por loja`)
          const id = randomBytes(9).toString('base64url')
          await sql`insert into produtos (id, loja_id, titulo, descricao, categoria, preco, preco_de, fotos)
                    values (${id}, ${loja}, ${p.titulo}, ${p.descricao}, ${p.categoria}, ${p.preco}, ${p.precoDe}, ${fotos}::jsonb)`
          responderJson(res, 201, { id })
        } else {
          const feitas = await sql`
            update produtos set titulo = ${p.titulo}, descricao = ${p.descricao}, categoria = ${p.categoria},
                                preco = ${p.preco}, preco_de = ${p.precoDe}, fotos = ${fotos}::jsonb
             where id = ${textoDe(corpo, 'id', 40)} and loja_id = ${loja} returning id`
          if (feitas.length === 0) throw new ErroDoCliente('produto não encontrado', 404)
          responderJson(res, 204, undefined)
        }
        return
      }

      case 'POST ativo': {
        const corpo = await lerJson(req)
        const feitas = await sql`update produtos set ativo = ${corpo.ativo === true}
                                  where id = ${textoDe(corpo, 'id', 40)} and loja_id = ${loja} returning id`
        if (feitas.length === 0) throw new ErroDoCliente('produto não encontrado', 404)
        responderJson(res, 204, undefined)
        return
      }

      case 'DELETE produto': {
        const feitas = await sql`delete from produtos where id = ${parametro(req, 'id')} and loja_id = ${loja} returning id`
        if (feitas.length === 0) throw new ErroDoCliente('produto não encontrado', 404)
        responderJson(res, 204, undefined)
        return
      }

      default:
        throw new ErroDoCliente('pedido desconhecido', 404)
    }
  } catch (erro) {
    responderErro(res, erro)
  }
}

