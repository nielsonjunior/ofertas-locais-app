import { describe, expect, it } from 'vitest'
import { responder } from '../src/dominio/conversa'
import type { Contexto, Contato } from '../src/dominio/conversa'
import type { OfertaNaVitrine } from '../src/dominio/tipos'

const cidades = [
  { id: 'caceres-mt', nome: 'Cáceres', uf: 'MT' },
  { id: 'cuiaba-mt', nome: 'Cuiabá', uf: 'MT' }
]

function oferta(id: string, produto: string, quantidade: string, preco: number, mercadoNome = 'Atacadão'): OfertaNaVitrine {
  return {
    id, produto, marca: '', quantidade, preco, precoDe: null, condicao: '',
    mercadoId: mercadoNome.toLowerCase(), mercadoNome, panfletoId: `p-${mercadoNome}`
  }
}

const ctx: Contexto = {
  cidades,
  siteUrl: 'https://ofertas.exemplo',
  panfletos: [
    { id: 'p-Atacadão', mercadoNome: 'Atacadão', validoAte: '2026-10-19' },
    { id: 'p-Comper', mercadoNome: 'Comper', validoAte: '2026-10-18' }
  ],
  ofertas: [
    oferta('a', 'Arroz Tipo 1', '5 kg', 2799),
    oferta('b', 'Arroz Tipo 1', '5 kg', 2599, 'Comper'),
    oferta('c', 'Feijão Carioca', '1 kg', 799)
  ]
}

const pronto: Contato = { waId: '5565999990000', cidadeId: 'caceres-mt' }
const novo: Contato = { waId: '5565999990000', cidadeId: null }

function texto(r: ReturnType<typeof responder>): string {
  return r.respostas.join('\n---\n')
}

describe('quem ainda não tem cidade', () => {
  it('recebe a lista de cidades numerada', () => {
    const r = responder(null, 'oi', ctx, '5565999990000')
    expect(r.contato).toEqual(novo)
    expect(texto(r)).toContain('1. Cáceres - MT')
    expect(texto(r)).toContain('2. Cuiabá - MT')
  })

  it('escolhe pelo número', () => {
    const r = responder(novo, '1', ctx, novo.waId)
    expect(r.contato?.cidadeId).toBe('caceres-mt')
    expect(texto(r)).toContain('Cáceres')
  })

  it('escolhe pelo nome, sem acento', () => {
    const r = responder(novo, 'cuiaba', ctx, novo.waId)
    expect(r.contato?.cidadeId).toBe('cuiaba-mt')
  })

  it('número fora da lista pergunta de novo', () => {
    const r = responder(novo, '9', ctx, novo.waId)
    expect(r.contato?.cidadeId).toBeNull()
    expect(texto(r)).toContain('1. Cáceres - MT')
  })
})

describe('quem já tem cidade', () => {
  it('busca e mostra o mais barato primeiro, com o mercado', () => {
    const r = responder(pronto, 'arroz', ctx, pronto.waId)
    const t = texto(r)
    expect(t.indexOf('Comper')).toBeLessThan(t.indexOf('Atacadão'))
    expect(t).toContain('R$ 25,99')
    expect(t).toContain('R$ 5,20/kg')
    expect(t).toContain('https://ofertas.exemplo/busca?cidade=caceres-mt&q=arroz')
  })

  it('mostra no máximo 5 ofertas', () => {
    const muitas = Array.from({ length: 8 }, (_, i) => oferta(`x${i}`, 'Leite Integral', '1 L', 400 + i))
    const r = responder(pronto, 'leite', { ...ctx, ofertas: muitas }, pronto.waId)
    expect(texto(r).match(/Leite Integral/g)).toHaveLength(5)
  })

  it('diz quando não achou', () => {
    const r = responder(pronto, 'picanha', ctx, pronto.waId)
    expect(texto(r)).toContain('Não achei "picanha"')
  })

  it('PANFLETOS lista os panfletos valendo, com link', () => {
    const r = responder(pronto, 'Panfletos', ctx, pronto.waId)
    expect(texto(r)).toContain('Atacadão')
    expect(texto(r)).toContain('https://ofertas.exemplo/panfleto/p-Comper')
    expect(texto(r)).toContain('até 18/10')
  })

  it('PANFLETOS sem nenhum valendo avisa', () => {
    const r = responder(pronto, 'panfletos', { ...ctx, panfletos: [] }, pronto.waId)
    expect(texto(r)).toContain('Ainda não há panfleto valendo em Cáceres')
  })

  it('o nome de um mercado manda o panfleto dele', () => {
    const r = responder(pronto, 'comper', ctx, pronto.waId)
    expect(texto(r)).toContain('https://ofertas.exemplo/panfleto/p-Comper')
  })

  it('"ofertas do Atacadão" e "panfleto da Comper" também', () => {
    expect(texto(responder(pronto, 'ofertas do Atacadão', ctx, pronto.waId))).toContain('/panfleto/p-Atacad')
    expect(texto(responder(pronto, 'Panfleto da comper', ctx, pronto.waId))).toContain('/panfleto/p-Comper')
  })

  it('oi mostra o que dá para fazer', () => {
    const r = responder(pronto, 'Oi!', ctx, pronto.waId)
    expect(texto(r)).toContain('PANFLETOS')
    expect(texto(r)).toContain('CIDADE')
  })

  it('CIDADE volta para a escolha', () => {
    const r = responder(pronto, 'cidade', ctx, pronto.waId)
    expect(r.contato?.cidadeId).toBeNull()
    expect(texto(r)).toContain('1. Cáceres - MT')
  })

  it('cidade que saiu do ar volta para a escolha', () => {
    const sumiu: Contato = { waId: pronto.waId, cidadeId: 'rondonopolis-mt' }
    const r = responder(sumiu, 'arroz', ctx, sumiu.waId)
    expect(r.contato?.cidadeId).toBeNull()
  })
})

describe('SAIR', () => {
  it('apaga o contato em qualquer etapa', () => {
    expect(responder(pronto, 'SAIR', ctx, pronto.waId).contato).toBeNull()
    expect(responder(novo, 'parar', ctx, novo.waId).contato).toBeNull()
    expect(responder(null, 'sair', ctx, novo.waId).contato).toBeNull()
  })
})

describe('mensagem estranha', () => {
  it('mensagem vazia (foto, áudio) explica que é por texto', () => {
    const r = responder(pronto, '', ctx, pronto.waId)
    expect(r.contato).toEqual(pronto)
    expect(texto(r)).toContain('por texto')
  })

  it('texto enorme é cortado antes de buscar', () => {
    const r = responder(pronto, 'a'.repeat(5000), ctx, pronto.waId)
    expect(texto(r).length).toBeLessThan(1000)
  })
})
