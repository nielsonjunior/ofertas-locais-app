import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { del, put } from '@vercel/blob'
import { banco } from './_banco.js'
import type { Sql } from './_banco.js'
import { entrar, exigirEquipe, quemEsta, sair } from './_equipe.js'
import { ErroDoCliente, lerBytes, lerJson, parametro, responderErro, responderJson, textoDe } from './_http.js'
import { LeituraRecusada, lerPagina } from './_ia.js'
import { extensao, tipoPelosBytes } from './_tipo.js'
import { validarOfertaDigitada } from '../src/dominio/digitada.js'
import { limparLeitura } from '../src/dominio/leitura.js'
import { normalizar } from '../src/dominio/busca.js'
import { dataValida, hojeEmCuiaba } from '../src/dominio/validade.js'

/**
 * O endereço /api/equipe: tudo o que a equipe faz para pôr um panfleto no ar.
 * Exige sessão (cookie) em tudo menos entrar; o que muda algo exige também
 * o cabeçalho X-Requested-With: ofertas.
 *
 *   POST ?acao=entrar        { usuario, senha }
 *   POST ?acao=sair
 *   GET  ?acao=eu
 *   GET  ?acao=mercados
 *   POST ?acao=mercado       { cidadeId, nome, endereco }
 *   POST ?acao=cidade        { nome, uf }
 *   GET  ?acao=panfletos
 *   POST ?acao=panfleto      { mercadoId, validoDe?, validoAte? }      -> { id }
 *   GET  ?acao=panfleto&id=
 *   PUT  ?acao=panfleto      { id, validoDe, validoAte }
 *   DELETE ?acao=panfleto&id=
 *   POST ?acao=pagina&panfleto=   corpo = a imagem ou o PDF (até 4 MB)
 *   POST ?acao=oferta        { panfletoId, produto, marca, quantidade, preco, precoDe, condicao }
 *   PUT  ?acao=oferta        { id, ... }   (conferir uma oferta tira a marca de "baixa")
 *   DELETE ?acao=oferta&id=
 *   POST ?acao=publicar      { id }
 *   POST ?acao=despublicar   { id }
 */

const TAMANHO_DA_PAGINA = 4 * 1024 * 1024
const PAGINAS_POR_PANFLETO = 20

function novoId(): string {
  return randomBytes(9).toString('base64url')
}

function idDaCidade(nome: string, uf: string): string {
  return `${normalizar(nome).replace(/ /g, '-')}-${uf.toLowerCase()}`
}

async function panfletoDaEquipe(sql: Sql, id: string) {
  const [p] = await sql`
    select p.*, m.nome as mercado_nome, m.cidade_id from panfletos p
      join mercados m on m.id = p.mercado_id where p.id = ${id}`
  if (!p) throw new ErroDoCliente('panfleto não encontrado', 404)
  return p
}

function datasOpcionais(corpo: Record<string, unknown>): { validoDe: string; validoAte: string } {
  const validoDe = typeof corpo.validoDe === 'string' ? corpo.validoDe : ''
  const validoAte = typeof corpo.validoAte === 'string' ? corpo.validoAte : ''
  if ((validoDe && !dataValida(validoDe)) || (validoAte && !dataValida(validoAte))) {
    throw new ErroDoCliente('data inválida (use o calendário)')
  }
  if (validoDe && validoAte && validoDe > validoAte) throw new ErroDoCliente('a validade termina antes de começar')
  return { validoDe, validoAte }
}

async function lerUmaPagina(req: IncomingMessage, sql: Sql, panfletoId: string) {
  const p = await panfletoDaEquipe(sql, panfletoId)
  if (p.estado === 'publicado') throw new ErroDoCliente('despublique antes de mexer nas páginas')
  const paginas = p.paginas as { caminho: string; tipo: string }[]
  if (paginas.length >= PAGINAS_POR_PANFLETO) throw new ErroDoCliente('páginas demais neste panfleto')

  const bytes = await lerBytes(req, TAMANHO_DA_PAGINA)
  const tipo = tipoPelosBytes(bytes)
  if (!tipo) throw new ErroDoCliente('mande foto (JPG, PNG, WEBP) ou PDF')

  const caminho = `panfletos/${panfletoId}/${novoId()}.${extensao(tipo)}`
  await put(caminho, bytes, { access: 'private', contentType: tipo, addRandomSuffix: false })
  const numero = paginas.length + 1
  // A página entra antes da leitura: se a IA falhar, ela fica guardada e a
  // equipe digita as ofertas à mão. Enquanto a IA lê, lendo_ate trava a
  // publicação — senão alguém publica no meio e as ofertas lidas entram no ar
  // sem conferência. A trava vence sozinha depois do tempo máximo da função.
  const marcado = await sql`
    update panfletos set paginas = paginas || ${JSON.stringify([{ caminho, tipo }])}::jsonb,
                         estado = 'conferir', lendo_ate = now() + interval '3 minutes'
     where id = ${panfletoId} and estado <> 'publicado'
    returning id`
  if (marcado.length === 0) {
    await del(caminho).catch(() => {})
    throw new ErroDoCliente('despublique antes de mexer nas páginas')
  }

  try {
    const leitura = limparLeitura(await lerPagina(bytes, tipo, hojeEmCuiaba()), numero)
    if (leitura.ofertas.length > 0) {
      await sql.transaction(leitura.ofertas.map((o) => sql`
        insert into ofertas (id, panfleto_id, produto, marca, quantidade, preco, preco_de, condicao, pagina, confianca)
        values (${novoId()}, ${panfletoId}, ${o.produto}, ${o.marca}, ${o.quantidade}, ${o.preco},
                ${o.precoDe}, ${o.condicao}, ${o.pagina}, ${o.confianca})`))
    }
    if (leitura.validade) {
      await sql`update panfletos set
                  valido_de = case when valido_de = '' then ${leitura.validade.validoDe} else valido_de end,
                  valido_ate = case when valido_ate = '' then ${leitura.validade.validoAte} else valido_ate end
                where id = ${panfletoId}`
    }
    return { pagina: numero, lidas: leitura.ofertas.length, descartadas: leitura.descartadas, aviso: '' }
  } catch (erro) {
    console.error('leitura da página falhou', erro)
    const aviso = erro instanceof LeituraRecusada ? erro.message : 'a leitura automática falhou'
    return { pagina: numero, lidas: 0, descartadas: 0, aviso: `${aviso}; digite as ofertas desta página à mão` }
  } finally {
    // Só depois das ofertas gravadas: quem publicar daqui em diante já as vê.
    await sql`update panfletos set lendo_ate = null where id = ${panfletoId}`
  }
}

/** Mexer em oferta só com o panfleto fora do ar: o que está no ar passou pela conferência. */
async function exigirForaDoAr(sql: Sql, panfletoId: string): Promise<void> {
  const p = await panfletoDaEquipe(sql, panfletoId)
  if (p.estado === 'publicado') throw new ErroDoCliente('tire o panfleto do ar antes de mexer nas ofertas')
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const acao = parametro(req, 'acao')
    const metodo = req.method ?? 'GET'

    if (acao === 'entrar' && metodo === 'POST') {
      const corpo = await lerJson(req)
      const usuario = await entrar(req, res, textoDe(corpo, 'usuario', 60), String(corpo.senha ?? ''))
      responderJson(res, 200, { usuario })
      return
    }
    if (acao === 'sair' && metodo === 'POST') {
      await sair(req, res)
      responderJson(res, 204, undefined)
      return
    }
    if (acao === 'eu' && metodo === 'GET') {
      responderJson(res, 200, { usuario: await quemEsta(req) })
      return
    }

    const usuario = await exigirEquipe(req)
    const sql = await banco()
    const rota = `${metodo} ${acao}`

    switch (rota) {
      case 'GET mercados': {
        const [lista, todasCidades] = await Promise.all([
          sql`select id, cidade_id, nome, endereco, ativo from mercados order by nome`,
          sql`select id, nome, uf from cidades order by nome`
        ])
        responderJson(res, 200, {
          cidades: todasCidades,
          mercados: lista.map((m) => ({
            id: m.id, cidadeId: m.cidade_id, nome: m.nome, endereco: m.endereco, ativo: m.ativo
          }))
        })
        return
      }

      case 'POST mercado': {
        const corpo = await lerJson(req)
        const cidadeId = textoDe(corpo, 'cidadeId', 80)
        const [cidade] = await sql`select id from cidades where id = ${cidadeId}`
        if (!cidade) throw new ErroDoCliente('cidade desconhecida')
        const id = novoId()
        await sql`insert into mercados (id, cidade_id, nome, endereco)
                  values (${id}, ${cidadeId}, ${textoDe(corpo, 'nome', 80)}, ${textoDe(corpo, 'endereco', 160, false)})`
        responderJson(res, 201, { id })
        return
      }

      case 'POST cidade': {
        const corpo = await lerJson(req)
        const nome = textoDe(corpo, 'nome', 60)
        const uf = textoDe(corpo, 'uf', 2).toUpperCase()
        if (!/^[A-Z]{2}$/.test(uf)) throw new ErroDoCliente('UF com duas letras (MT)')
        const id = idDaCidade(nome, uf)
        await sql`insert into cidades (id, nome, uf) values (${id}, ${nome}, ${uf}) on conflict do nothing`
        responderJson(res, 201, { id })
        return
      }

      case 'GET panfletos': {
        const lista = await sql`
          select p.id, p.estado, p.valido_de, p.valido_ate, p.criado_em, jsonb_array_length(p.paginas) as paginas,
                 m.nome as mercado_nome,
                 (select count(*) from ofertas o where o.panfleto_id = p.id)::int as ofertas,
                 (select count(*) from ofertas o where o.panfleto_id = p.id and o.confianca = 'baixa')::int as duvidas
            from panfletos p join mercados m on m.id = p.mercado_id
           order by p.criado_em desc limit 100`
        responderJson(res, 200, lista.map((p) => ({
          id: p.id, estado: p.estado, validoDe: p.valido_de, validoAte: p.valido_ate, mercadoNome: p.mercado_nome,
          paginas: Number(p.paginas), ofertas: p.ofertas, duvidas: p.duvidas
        })))
        return
      }

      case 'POST panfleto': {
        const corpo = await lerJson(req)
        const mercadoId = textoDe(corpo, 'mercadoId', 40)
        const [mercado] = await sql`select id from mercados where id = ${mercadoId} and ativo`
        if (!mercado) throw new ErroDoCliente('mercado desconhecido')
        const { validoDe, validoAte } = datasOpcionais(corpo)
        const id = novoId()
        await sql`insert into panfletos (id, mercado_id, valido_de, valido_ate, criado_por)
                  values (${id}, ${mercadoId}, ${validoDe}, ${validoAte}, ${usuario})`
        responderJson(res, 201, { id })
        return
      }

      case 'GET panfleto': {
        const id = parametro(req, 'id')
        const p = await panfletoDaEquipe(sql, id)
        const ofertas = await sql`
          select id, produto, marca, quantidade, preco, preco_de, condicao, pagina, confianca
            from ofertas where panfleto_id = ${id} order by pagina, confianca desc, produto`
        responderJson(res, 200, {
          id: p.id, estado: p.estado, validoDe: p.valido_de, validoAte: p.valido_ate,
          mercadoNome: p.mercado_nome, paginas: (p.paginas as unknown[]).length,
          ofertas: ofertas.map((o) => ({
            id: o.id, produto: o.produto, marca: o.marca, quantidade: o.quantidade, preco: o.preco,
            precoDe: o.preco_de, condicao: o.condicao, pagina: o.pagina, confianca: o.confianca
          }))
        })
        return
      }

      case 'PUT panfleto': {
        const corpo = await lerJson(req)
        const id = textoDe(corpo, 'id', 40)
        await panfletoDaEquipe(sql, id)
        const { validoDe, validoAte } = datasOpcionais(corpo)
        await sql`update panfletos set valido_de = ${validoDe}, valido_ate = ${validoAte} where id = ${id}`
        responderJson(res, 204, undefined)
        return
      }

      case 'DELETE panfleto': {
        const id = parametro(req, 'id')
        const p = await panfletoDaEquipe(sql, id)
        const caminhos = (p.paginas as { caminho: string }[]).map((x) => x.caminho)
        await sql`delete from panfletos where id = ${id}`
        if (caminhos.length) await del(caminhos).catch((e: unknown) => console.error('não apagou páginas', e))
        responderJson(res, 204, undefined)
        return
      }

      case 'POST pagina': {
        responderJson(res, 201, await lerUmaPagina(req, sql, parametro(req, 'panfleto')))
        return
      }

      case 'POST oferta':
      case 'PUT oferta': {
        const corpo = await lerJson(req)
        let oferta
        try {
          oferta = validarOfertaDigitada(corpo)
        } catch (erro) {
          throw new ErroDoCliente((erro as Error).message)
        }
        if (metodo === 'POST') {
          const panfletoId = textoDe(corpo, 'panfletoId', 40)
          await exigirForaDoAr(sql, panfletoId)
          const p = await panfletoDaEquipe(sql, panfletoId)
          const pagina = Math.max(1, Math.min(Number(corpo.pagina) || 1, (p.paginas as unknown[]).length || 1))
          const id = novoId()
          // A condição vai na própria instrução: se publicarem entre a conferência acima e aqui, nada entra.
          const feitas = await sql`
            insert into ofertas (id, panfleto_id, produto, marca, quantidade, preco, preco_de, condicao, pagina, confianca)
            select ${id}, ${panfletoId}, ${oferta.produto}, ${oferta.marca}, ${oferta.quantidade},
                   ${oferta.preco}, ${oferta.precoDe}, ${oferta.condicao}, ${pagina}, 'alta'
             where exists (select 1 from panfletos where id = ${panfletoId} and estado <> 'publicado')
            returning id`
          if (feitas.length === 0) throw new ErroDoCliente('tire o panfleto do ar antes de mexer nas ofertas')
          responderJson(res, 201, { id })
        } else {
          const id = textoDe(corpo, 'id', 40)
          const feitas = await sql`
            update ofertas o set produto = ${oferta.produto}, marca = ${oferta.marca}, quantidade = ${oferta.quantidade},
                               preco = ${oferta.preco}, preco_de = ${oferta.precoDe}, condicao = ${oferta.condicao},
                               confianca = 'alta'
              from panfletos p
             where o.id = ${id} and p.id = o.panfleto_id and p.estado <> 'publicado'
            returning o.id`
          if (feitas.length === 0) throw new ErroDoCliente('oferta não encontrada, ou o panfleto está no ar', 404)
          responderJson(res, 204, undefined)
        }
        return
      }

      case 'DELETE oferta': {
        const feitas = await sql`
          delete from ofertas o using panfletos p
           where o.id = ${parametro(req, 'id')} and p.id = o.panfleto_id and p.estado <> 'publicado'
          returning o.id`
        if (feitas.length === 0) throw new ErroDoCliente('oferta não encontrada, ou o panfleto está no ar', 404)
        responderJson(res, 204, undefined)
        return
      }

      case 'POST publicar': {
        const corpo = await lerJson(req)
        const id = textoDe(corpo, 'id', 40)
        const p = await panfletoDaEquipe(sql, id)
        if (!dataValida(String(p.valido_de)) || !dataValida(String(p.valido_ate))) {
          throw new ErroDoCliente('preencha a validade antes de publicar')
        }
        const hoje = hojeEmCuiaba()
        if (String(p.valido_ate) < hoje) throw new ErroDoCliente('este panfleto já venceu')
        // Tudo conferido numa instrução só, para não haver brecha entre conferir e publicar.
        const feitas = await sql`
          update panfletos set estado = 'publicado', publicado_em = now()
           where id = ${id} and estado <> 'publicado'
             and (lendo_ate is null or lendo_ate < now())
             and valido_ate >= ${hoje}
             and exists (select 1 from ofertas where panfleto_id = ${id})
             and not exists (select 1 from ofertas where panfleto_id = ${id} and confianca = 'baixa')
          returning id`
        if (feitas.length === 0) {
          const [conta] = await sql`
            select count(*)::int as total, count(*) filter (where confianca = 'baixa')::int as duvidas
              from ofertas where panfleto_id = ${id}`
          const [agora] = await sql`select estado, lendo_ate > now() as lendo from panfletos where id = ${id}`
          if (agora?.estado === 'publicado') throw new ErroDoCliente('este panfleto já está no ar')
          if (agora?.lendo) throw new ErroDoCliente('ainda lendo uma página; espere terminar')
          if (!conta || conta.total === 0) throw new ErroDoCliente('o panfleto não tem nenhuma oferta')
          throw new ErroDoCliente(`confira as ${conta.duvidas} ofertas marcadas em amarelo antes de publicar`)
        }
        responderJson(res, 204, undefined)
        return
      }

      case 'POST despublicar': {
        const corpo = await lerJson(req)
        await sql`update panfletos set estado = 'conferir' where id = ${textoDe(corpo, 'id', 40)}`
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
