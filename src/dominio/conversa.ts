import { buscar, normalizar } from './busca.js'
import { emReais } from './dinheiro.js'
import type { Cidade, ProdutoNaVitrine } from './tipos.js'

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

export interface Contexto {
  cidades: Cidade[]
  /** Produtos no ar na cidade do contato, na ordem do feed (vazio se ele não tem cidade). */
  produtos: ProdutoNaVitrine[]
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
const CIDADE = new Set(['cidade', 'trocar cidade', 'mudar cidade'])

function listaDeCidades(cidades: Cidade[]): string {
  const linhas = cidades.map((c, i) => `${i + 1}. ${c.nome} - ${c.uf}`)
  return `Oi! Aqui você vê o que as lojas da sua cidade estão vendendo.\n\nEm qual cidade você está? Responda com o número:\n\n${linhas.join('\n')}`
}

function menu(cidade: Cidade, siteUrl: string): string {
  return [
    `Você está vendo as lojas de *${cidade.nome}*.`,
    '',
    'Mande o que você procura (ex.: *tênis*, *bolo*, *ração*) e eu mostro quem tem.',
    '',
    `Ou veja tudo no feed: ${siteUrl}/c/${encodeURIComponent(cidade.id)}`,
    '',
    '*CIDADE* — trocar de cidade',
    '*SAIR* — parar e apagar seu número'
  ].join('\n')
}

function acharCidade(texto: string, cidades: Cidade[]): Cidade | undefined {
  if (/^\d+$/.test(texto)) return cidades[Number(texto) - 1]
  return cidades.find((c) => normalizar(c.nome) === texto)
}

function linhaDoProduto(p: ProdutoNaVitrine, siteUrl: string): string {
  return `• *${p.titulo}* — ${emReais(p.preco)}\n   ${p.lojaNome}\n   ${siteUrl}/p/${encodeURIComponent(p.id)}`
}

function resultadoDaBusca(ctx: Contexto, cidade: Cidade, consulta: string): string {
  const achados = buscar(ctx.produtos, consulta)
  if (achados.length === 0) {
    return `Não achei "${consulta}" nas lojas de ${cidade.nome} agora. Tente outro nome, ou veja o feed: ${ctx.siteUrl}/c/${encodeURIComponent(cidade.id)}`
  }
  const link = `${ctx.siteUrl}/busca?cidade=${encodeURIComponent(cidade.id)}&q=${encodeURIComponent(consulta)}`
  const fim = achados.length > MAXIMO_NA_RESPOSTA ? `Ver os ${achados.length}: ${link}` : link
  return `${achados.slice(0, MAXIMO_NA_RESPOSTA).map((p) => linhaDoProduto(p, ctx.siteUrl)).join('\n\n')}\n\n${fim}`
}

export function responder(contato: Contato | null, mensagem: string, ctx: Contexto, waId: string): Resultado {
  const original = mensagem.trim().slice(0, MAXIMO_DA_BUSCA)
  const texto = normalizar(original)
  const atual: Contato = contato ?? { waId, cidadeId: null }

  if (SAIR.has(texto)) {
    return { contato: null, respostas: ['Pronto, apaguei seu número. Se quiser voltar, é só mandar *oi*.'] }
  }

  if (!texto && contato?.cidadeId) {
    return { contato: atual, respostas: ['Por enquanto eu só entendo mensagem por texto. Mande o que você procura.'] }
  }

  const cidade = ctx.cidades.find((c) => c.id === atual.cidadeId)

  if (!cidade || CIDADE.has(texto)) {
    const escolhida = cidade ? undefined : acharCidade(texto, ctx.cidades)
    if (escolhida) {
      return { contato: { waId: atual.waId, cidadeId: escolhida.id }, respostas: [`Pronto! ${menu(escolhida, ctx.siteUrl)}`] }
    }
    return { contato: { waId: atual.waId, cidadeId: null }, respostas: [listaDeCidades(ctx.cidades)] }
  }

  if (SAUDACAO.has(texto)) return { contato: atual, respostas: [menu(cidade, ctx.siteUrl)] }

  const loja = ctx.produtos.find((p) => normalizar(p.lojaNome) === texto)
  if (loja) {
    return {
      contato: atual,
      respostas: [`Vitrine da *${loja.lojaNome}*:\n${ctx.siteUrl}/loja/${encodeURIComponent(loja.lojaId)}`]
    }
  }

  return { contato: atual, respostas: [resultadoDaBusca(ctx, cidade, original)] }
}
