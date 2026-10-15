import type { Sql } from './_banco.js'
import type { Cidade, OfertaNaVitrine } from '../src/dominio/tipos.js'

/**
 * O que o público vê: só panfleto publicado, de mercado ativo, dentro da
 * validade de hoje (data de Cuiabá, vinda de quem chama). Site e WhatsApp
 * leem daqui, para os dois mostrarem a mesma coisa.
 */

export interface PanfletoNaVitrine {
  id: string
  mercadoId: string
  mercadoNome: string
  mercadoEndereco: string
  validoDe: string
  validoAte: string
  paginas: number
  ofertas: number
}

export async function cidades(sql: Sql): Promise<Cidade[]> {
  const linhas = await sql`select id, nome, uf from cidades order by nome`
  return linhas.map((l) => ({ id: String(l.id), nome: String(l.nome), uf: String(l.uf) }))
}

export async function panfletosValidos(sql: Sql, cidadeId: string, hoje: string): Promise<PanfletoNaVitrine[]> {
  const linhas = await sql`
    select p.id, p.valido_de, p.valido_ate, jsonb_array_length(p.paginas) as paginas,
           m.id as mercado_id, m.nome as mercado_nome, m.endereco as mercado_endereco,
           (select count(*) from ofertas o where o.panfleto_id = p.id) as ofertas
      from panfletos p
      join mercados m on m.id = p.mercado_id
     where m.cidade_id = ${cidadeId} and m.ativo
       and p.estado = 'publicado' and p.valido_de <= ${hoje} and p.valido_ate >= ${hoje}
     order by m.nome`
  return linhas.map((l) => ({
    id: String(l.id),
    mercadoId: String(l.mercado_id),
    mercadoNome: String(l.mercado_nome),
    mercadoEndereco: String(l.mercado_endereco),
    validoDe: String(l.valido_de),
    validoAte: String(l.valido_ate),
    paginas: Number(l.paginas),
    ofertas: Number(l.ofertas)
  }))
}

function paraVitrine(l: Record<string, unknown>): OfertaNaVitrine {
  return {
    id: String(l.id),
    produto: String(l.produto),
    marca: String(l.marca),
    quantidade: String(l.quantidade),
    preco: Number(l.preco),
    precoDe: l.preco_de === null ? null : Number(l.preco_de),
    condicao: String(l.condicao),
    mercadoId: String(l.mercado_id),
    mercadoNome: String(l.mercado_nome),
    panfletoId: String(l.panfleto_id)
  }
}

export async function ofertasValidas(sql: Sql, cidadeId: string, hoje: string): Promise<OfertaNaVitrine[]> {
  const linhas = await sql`
    select o.id, o.produto, o.marca, o.quantidade, o.preco, o.preco_de, o.condicao, o.panfleto_id,
           m.id as mercado_id, m.nome as mercado_nome
      from ofertas o
      join panfletos p on p.id = o.panfleto_id
      join mercados m on m.id = p.mercado_id
     where m.cidade_id = ${cidadeId} and m.ativo
       and p.estado = 'publicado' and p.valido_de <= ${hoje} and p.valido_ate >= ${hoje}
     order by o.preco`
  return linhas.map(paraVitrine)
}

export async function ofertasDoPanfleto(sql: Sql, panfletoId: string): Promise<OfertaNaVitrine[]> {
  const linhas = await sql`
    select o.id, o.produto, o.marca, o.quantidade, o.preco, o.preco_de, o.condicao, o.panfleto_id,
           m.id as mercado_id, m.nome as mercado_nome
      from ofertas o
      join panfletos p on p.id = o.panfleto_id
      join mercados m on m.id = p.mercado_id
     where o.panfleto_id = ${panfletoId}
     order by o.pagina, o.produto`
  return linhas.map(paraVitrine)
}
