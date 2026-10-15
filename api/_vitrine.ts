import type { Sql } from './_banco.js'
import { ordenarFeed } from '../src/dominio/feed.js'
import type { Cidade, ProdutoNaVitrine } from '../src/dominio/tipos.js'

/**
 * O que o público vê: só produto ativo, de loja aprovada. Site e WhatsApp
 * leem daqui, para os dois mostrarem a mesma coisa.
 */

/** O feed da cidade carrega no máximo isto (mais novos). Paginação fica para quando passar disso. */
const LIMITE_DO_FEED = 300

export async function cidades(sql: Sql): Promise<Cidade[]> {
  const linhas = await sql`select id, nome, uf from cidades order by nome`
  return linhas.map((l) => ({ id: String(l.id), nome: String(l.nome), uf: String(l.uf) }))
}

export function paraVitrine(l: Record<string, unknown>): ProdutoNaVitrine {
  return {
    id: String(l.id),
    titulo: String(l.titulo),
    descricao: String(l.descricao),
    categoria: String(l.categoria),
    preco: Number(l.preco),
    precoDe: l.preco_de === null || l.preco_de === undefined ? null : Number(l.preco_de),
    fotos: l.fotos as string[],
    lojaId: String(l.loja_id),
    lojaNome: String(l.loja_nome),
    lojaWhatsapp: String(l.loja_whatsapp),
    criadoEm: new Date(String(l.criado_em)).toISOString()
  }
}

export async function feedDaCidade(sql: Sql, cidadeId: string, categoria = ''): Promise<ProdutoNaVitrine[]> {
  const linhas = await sql`
    select p.id, p.titulo, p.descricao, p.categoria, p.preco, p.preco_de, p.fotos, p.criado_em,
           l.id as loja_id, l.nome as loja_nome, l.whatsapp as loja_whatsapp
      from produtos p join lojas l on l.id = p.loja_id
     where l.cidade_id = ${cidadeId} and l.estado = 'aprovada' and p.ativo
       and (${categoria} = '' or p.categoria = ${categoria})
     order by p.criado_em desc
     limit ${LIMITE_DO_FEED}`
  return ordenarFeed(linhas.map(paraVitrine))
}

export async function produtoPublico(sql: Sql, id: string): Promise<ProdutoNaVitrine & { cidadeId: string } | null> {
  const [l] = await sql`
    select p.id, p.titulo, p.descricao, p.categoria, p.preco, p.preco_de, p.fotos, p.criado_em,
           l.id as loja_id, l.nome as loja_nome, l.whatsapp as loja_whatsapp, l.cidade_id
      from produtos p join lojas l on l.id = p.loja_id
     where p.id = ${id} and p.ativo and l.estado = 'aprovada'`
  return l ? { ...paraVitrine(l), cidadeId: String(l.cidade_id) } : null
}

export async function lojaPublica(sql: Sql, id: string) {
  const [l] = await sql`
    select l.id, l.nome, l.categoria, l.whatsapp, l.endereco, l.descricao, l.cidade_id, c.nome as cidade_nome
      from lojas l join cidades c on c.id = l.cidade_id
     where l.id = ${id} and l.estado = 'aprovada'`
  if (!l) return null
  const produtos = await sql`
    select p.id, p.titulo, p.descricao, p.categoria, p.preco, p.preco_de, p.fotos, p.criado_em,
           l.id as loja_id, l.nome as loja_nome, l.whatsapp as loja_whatsapp
      from produtos p join lojas l on l.id = p.loja_id
     where p.loja_id = ${id} and p.ativo
     order by p.criado_em desc limit 200`
  return {
    id: String(l.id), nome: String(l.nome), categoria: String(l.categoria), whatsapp: String(l.whatsapp),
    endereco: String(l.endereco), descricao: String(l.descricao),
    cidadeId: String(l.cidade_id), cidadeNome: String(l.cidade_nome),
    produtos: produtos.map(paraVitrine)
  }
}
