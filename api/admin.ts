import type { IncomingMessage, ServerResponse } from 'node:http'
import { banco } from './_banco.js'
import { exigirConta } from './_contas.js'
import { ErroDoCliente, lerJson, parametro, responderErro, responderJson, textoDe } from './_http.js'
import { normalizar } from '../src/dominio/busca.js'

/**
 * O endereço /api/admin: aprovar lojas, cuidar das denúncias, cadastrar
 * cidades. Só administrador.
 *
 *   GET  ?acao=lojas[&estado=pendente]
 *   POST ?acao=estado-da-loja   { id, estado }      aprovada | recusada | bloqueada | pendente
 *   GET  ?acao=denuncias
 *   POST ?acao=tirar-do-ar      { produtoId }       desativa e resolve as denúncias dele
 *   POST ?acao=resolver         { produtoId }       denúncias sem fundamento
 *   POST ?acao=cidade           { nome, uf }
 */

const ESTADOS = ['pendente', 'aprovada', 'recusada', 'bloqueada']

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await exigirConta(req, 'admin')
    const sql = await banco()
    const rota = `${req.method} ${parametro(req, 'acao')}`

    switch (rota) {
      case 'GET lojas': {
        const estado = parametro(req, 'estado')
        const [contagem] = await sql`select count(*)::int as total from lojas where (${estado} = '' or estado = ${estado})`
        const lojas = await sql`
          select l.id, l.nome, l.categoria, l.whatsapp, l.endereco, l.descricao, l.estado, l.criada_em,
                 c.nome as cidade_nome, c.uf, (select usuario from contas where loja_id = l.id limit 1) as usuario,
                 (select count(*)::int from produtos p where p.loja_id = l.id) as produtos
            from lojas l join cidades c on c.id = l.cidade_id
           where (${estado} = '' or l.estado = ${estado})
           order by l.criada_em asc limit 200`
        responderJson(res, 200, { total: contagem?.total ?? 0, lojas: lojas.map((l) => ({
          id: l.id, nome: l.nome, categoria: l.categoria, whatsapp: l.whatsapp, endereco: l.endereco,
          descricao: l.descricao, estado: l.estado, cidade: `${l.cidade_nome} - ${l.uf}`, usuario: l.usuario,
          produtos: l.produtos, criadaEm: l.criada_em
        })) })
        return
      }

      case 'POST estado-da-loja': {
        const corpo = await lerJson(req)
        const estado = String(corpo.estado ?? '')
        if (!ESTADOS.includes(estado)) throw new ErroDoCliente('estado desconhecido')
        const feitas = await sql`update lojas set estado = ${estado} where id = ${textoDe(corpo, 'id', 40)} returning id`
        if (feitas.length === 0) throw new ErroDoCliente('loja não encontrada', 404)
        // Loja bloqueada: derruba as sessões do lojista na hora.
        if (estado === 'bloqueada') {
          // O acesso já cai pela loja bloqueada (quemEsta); isto só limpa as sessões.
          await sql`delete from sessoes where usuario in (select usuario from contas where loja_id = ${textoDe(corpo, 'id', 40)})`
        }
        responderJson(res, 204, undefined)
        return
      }

      case 'GET denuncias': {
        // Uma linha por produto, com quantas denúncias e por quais motivos:
        // denúncia repetida não empurra as outras para fora da lista.
        const lista = await sql`
          select p.id as produto_id, p.titulo, p.fotos, p.preco, p.ativo and not p.removido as ativo,
                 l.id as loja_id, l.nome as loja_nome,
                 count(*)::int as quantas, array_agg(distinct d.motivo) as motivos, max(d.criada_em) as ultima
            from denuncias d join produtos p on p.id = d.produto_id join lojas l on l.id = p.loja_id
           where not d.resolvida
           group by p.id, l.id order by quantas desc, ultima desc limit 200`
        responderJson(res, 200, lista.map((d) => ({
          produtoId: d.produto_id, titulo: d.titulo, foto: (d.fotos as string[])[0] ?? '', preco: d.preco,
          ativo: d.ativo, lojaId: d.loja_id, lojaNome: d.loja_nome, quantas: d.quantas, motivos: d.motivos
        })))
        return
      }

      case 'POST tirar-do-ar': {
        const corpo = await lerJson(req)
        const id = textoDe(corpo, 'produtoId', 40)
        await sql.transaction([
          sql`update produtos set removido = true, ativo = false where id = ${id}`,
          sql`update denuncias set resolvida = true where produto_id = ${id}`
        ])
        responderJson(res, 204, undefined)
        return
      }

      case 'POST resolver': {
        const corpo = await lerJson(req)
        await sql`update denuncias set resolvida = true where produto_id = ${textoDe(corpo, 'produtoId', 40)}`
        responderJson(res, 204, undefined)
        return
      }

      case 'POST cidade': {
        const corpo = await lerJson(req)
        const nome = textoDe(corpo, 'nome', 60)
        const uf = textoDe(corpo, 'uf', 2).toUpperCase()
        if (!/^[A-Z]{2}$/.test(uf)) throw new ErroDoCliente('UF com duas letras (MT)')
        const id = `${normalizar(nome).replace(/ /g, '-')}-${uf.toLowerCase()}`
        await sql`insert into cidades (id, nome, uf) values (${id}, ${nome}, ${uf}) on conflict do nothing`
        responderJson(res, 201, { id })
        return
      }

      default:
        throw new ErroDoCliente('pedido desconhecido', 404)
    }
  } catch (erro) {
    responderErro(res, erro)
  }
}
