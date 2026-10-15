import { buscar, normalizar } from './busca.js'
import { emReais } from './dinheiro.js'
import type { Cidade, OfertaNaVitrine } from './tipos.js'
import { lerQuantidade, precoPorUnidade } from './unidade.js'

/**
 * A conversa do WhatsApp, inteira, sem rede nem banco: recebe quem escreveu e
 * o que escreveu, devolve o novo estado do contato e o que responder. O
 * webhook só carrega o contexto, chama esta função e envia.
 *
 * Do consumidor guardamos só o número e a cidade (LGPD). "SAIR" apaga.
 */

export interface Contato {
  waId: string
  cidadeId: string | null
}

export interface PanfletoNaConversa {
  id: string
  mercadoNome: string
  validoAte: string
}

export interface Contexto {
  cidades: Cidade[]
  /** Panfletos valendo hoje na cidade do contato (vazio se ele não tem cidade). */
  panfletos: PanfletoNaConversa[]
  /** Ofertas valendo hoje na cidade do contato. */
  ofertas: OfertaNaVitrine[]
  siteUrl: string
}

export interface Resultado {
  /** null = apagar o contato. */
  contato: Contato | null
  respostas: string[]
}

const MAXIMO_NA_RESPOSTA = 5
const MAXIMO_DA_BUSCA = 60

const SAIR = new Set(['sair', 'parar', 'cancelar', 'descadastrar'])
const SAUDACAO = new Set(['oi', 'ola', 'oie', 'menu', 'ajuda', 'inicio', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'eai', 'e ai'])
const PANFLETOS = new Set(['panfleto', 'panfletos', 'encarte', 'encartes', 'ofertas', 'oferta'])
const CIDADE = new Set(['cidade', 'trocar cidade', 'mudar cidade'])

function listaDeCidades(cidades: Cidade[]): string {
  const linhas = cidades.map((c, i) => `${i + 1}. ${c.nome} - ${c.uf}`)
  return `Oi! Aqui você vê as ofertas dos panfletos dos mercados da sua cidade.\n\nEm qual cidade você está? Responda com o número:\n\n${linhas.join('\n')}`
}

function menu(cidade: Cidade): string {
  return [
    `Você está vendo as ofertas de *${cidade.nome}*.`,
    '',
    'Mande o nome de um produto (ex.: *arroz*, *picanha*) e eu mostro onde está mais barato.',
    '',
    '*PANFLETOS* — os panfletos valendo hoje',
    '*CIDADE* — trocar de cidade',
    '*SAIR* — parar de receber e apagar seu número'
  ].join('\n')
}

function acharCidade(texto: string, cidades: Cidade[]): Cidade | undefined {
  if (/^\d+$/.test(texto)) return cidades[Number(texto) - 1]
  return cidades.find((c) => normalizar(c.nome) === texto)
}

function diaMes(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`
}

function linkDoPanfleto(ctx: Contexto, id: string): string {
  return `${ctx.siteUrl}/panfleto/${encodeURIComponent(id)}`
}

function panfletos(ctx: Contexto, cidade: Cidade): string {
  if (ctx.panfletos.length === 0) {
    return `Ainda não há panfleto valendo em ${cidade.nome}. Volte daqui a pouco!`
  }
  const linhas = ctx.panfletos.map(
    (p) => `*${p.mercadoNome}* (até ${diaMes(p.validoAte)})\n${linkDoPanfleto(ctx, p.id)}`
  )
  return `Panfletos valendo em ${cidade.nome}:\n\n${linhas.join('\n\n')}`
}

function linhaDaOferta(o: OfertaNaVitrine): string {
  const nome = [o.produto, o.marca, o.quantidade].filter(Boolean).join(' ')
  const porUnidade = precoPorUnidade(o.preco, lerQuantidade(o.quantidade))
  const extra = porUnidade ? ` (${emReais(porUnidade.centavos)}/${porUnidade.por})` : ''
  const condicao = o.condicao ? `\n   ${o.condicao}` : ''
  return `• ${nome} — *${emReais(o.preco)}*${extra}\n   ${o.mercadoNome}${condicao}`
}

function resultadoDaBusca(ctx: Contexto, cidade: Cidade, consulta: string): string {
  const achadas = buscar(ctx.ofertas, consulta)
  if (achadas.length === 0) {
    return `Não achei "${consulta}" nos panfletos de ${cidade.nome} desta semana. Tente outro nome, ou mande *PANFLETOS*.`
  }
  const link = `${ctx.siteUrl}/busca?cidade=${encodeURIComponent(cidade.id)}&q=${encodeURIComponent(consulta)}`
  const mais = achadas.length > MAXIMO_NA_RESPOSTA ? `\n\nVer as ${achadas.length}: ${link}` : `\n\n${link}`
  return `${achadas.slice(0, MAXIMO_NA_RESPOSTA).map(linhaDaOferta).join('\n\n')}${mais}`
}

export function responder(contato: Contato | null, mensagem: string, ctx: Contexto, waId: string): Resultado {
  const original = mensagem.trim().slice(0, MAXIMO_DA_BUSCA)
  const texto = normalizar(original)
  const atual: Contato = contato ?? { waId, cidadeId: null }

  if (SAIR.has(texto)) {
    return { contato: null, respostas: ['Pronto, apaguei seu número. Se quiser voltar, é só mandar *oi*.'] }
  }

  if (!texto && contato?.cidadeId) {
    return { contato: atual, respostas: ['Por enquanto eu só entendo mensagem por texto. Mande o nome de um produto, ou *PANFLETOS*.'] }
  }

  const cidade = ctx.cidades.find((c) => c.id === atual.cidadeId)

  if (!cidade || CIDADE.has(texto)) {
    const escolhida = cidade ? undefined : acharCidade(texto, ctx.cidades)
    if (escolhida) {
      const novo = { waId: atual.waId, cidadeId: escolhida.id }
      return { contato: novo, respostas: [`Pronto! ${menu(escolhida)}`] }
    }
    return { contato: { waId: atual.waId, cidadeId: null }, respostas: [listaDeCidades(ctx.cidades)] }
  }

  if (SAUDACAO.has(texto)) return { contato: atual, respostas: [menu(cidade)] }
  if (PANFLETOS.has(texto)) return { contato: atual, respostas: [panfletos(ctx, cidade)] }

  const doMercado = ctx.panfletos.find((p) => normalizar(p.mercadoNome) === texto)
  if (doMercado) {
    return {
      contato: atual,
      respostas: [`Panfleto do *${doMercado.mercadoNome}* (até ${diaMes(doMercado.validoAte)}):\n${linkDoPanfleto(ctx, doMercado.id)}`]
    }
  }

  return { contato: atual, respostas: [resultadoDaBusca(ctx, cidade, original)] }
}
