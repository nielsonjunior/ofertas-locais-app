import { describe, expect, it } from 'vitest'
import { responder } from '../src/dominio/conversa'
import type { Contato, Contexto } from '../src/dominio/conversa'
import type { ProdutoNaVitrine } from '../src/dominio/tipos'

const cidades = [
  { id: 'caceres-mt', nome: 'Cáceres', uf: 'MT' },
  { id: 'cuiaba-mt', nome: 'Cuiabá', uf: 'MT' }
]

function produto(id: string, titulo: string, preco: number, lojaNome = 'Casa do Tênis'): ProdutoNaVitrine {
  return {
    id, titulo, descricao: '', categoria: 'roupas', preco, precoDe: null, fotos: ['https://img/x.jpg'],
    lojaId: lojaNome.toLowerCase().replace(/ /g, '-'), lojaNome, lojaWhatsapp: '65999990000', criadoEm: '2026-10-16'
  }
}

const ctx: Contexto = {
  cidades,
  siteUrl: 'https://ofertas.exemplo',
  produtos: [
    produto('a', 'Tênis Nike Revolution', 34990),
    produto('b', 'Tênis Olympikus', 19990, 'Moda Center'),
    produto('c', 'Camiseta Polo', 5990, 'Moda Center')
  ]
}

const pronto: Contato = { waId: '5565999990000', cidadeId: 'caceres-mt' }
const novo: Contato = { waId: '5565999990000', cidadeId: null }

function texto(r: ReturnType<typeof responder>): string {
  return r.respostas.join('\n---\n')
}

describe('quem ainda não tem cidade', () => {
  it('recebe a lista de cidades numerada', () => {
    const r = responder(null, 'oi', ctx, novo.waId)
    expect(r.contato).toEqual(novo)
    expect(texto(r)).toContain('1. Cáceres - MT')
  })

  it('escolhe pelo número ou pelo nome sem acento', () => {
    expect(responder(novo, '1', ctx, novo.waId).contato?.cidadeId).toBe('caceres-mt')
    expect(responder(novo, 'cuiaba', ctx, novo.waId).contato?.cidadeId).toBe('cuiaba-mt')
  })

  it('número fora da lista pergunta de novo', () => {
    const r = responder(novo, '9', ctx, novo.waId)
    expect(r.contato?.cidadeId).toBeNull()
    expect(texto(r)).toContain('1. Cáceres - MT')
  })
})

describe('quem já tem cidade', () => {
  it('busca produtos e manda o link de cada um, com loja e preço', () => {
    const t = texto(responder(pronto, 'tenis', ctx, pronto.waId))
    expect(t).toContain('*Tênis Nike Revolution* — R$ 349,90')
    expect(t).toContain('Casa do Tênis')
    expect(t).toContain('https://ofertas.exemplo/p/a')
    expect(t).toContain('https://ofertas.exemplo/busca?cidade=caceres-mt&q=tenis')
  })

  it('mostra no máximo 5', () => {
    const muitos = Array.from({ length: 8 }, (_, i) => produto(`x${i}`, `Boné modelo ${i}`, 3000 + i))
    const t = texto(responder(pronto, 'boné', { ...ctx, produtos: muitos }, pronto.waId))
    expect(t.match(/Boné modelo/g)).toHaveLength(5)
    expect(t).toContain('Ver os 8')
  })

  it('diz quando não achou', () => {
    expect(texto(responder(pronto, 'geladeira', ctx, pronto.waId))).toContain('Não achei "geladeira"')
  })

  it('o nome de uma loja manda a vitrine dela', () => {
    const t = texto(responder(pronto, 'moda center', ctx, pronto.waId))
    expect(t).toContain('https://ofertas.exemplo/loja/moda-center')
  })

  it('oi mostra o que dá para fazer', () => {
    const t = texto(responder(pronto, 'Oi!', ctx, pronto.waId))
    expect(t).toContain('CIDADE')
    expect(t).toContain('SAIR')
  })

  it('CIDADE volta para a escolha', () => {
    const r = responder(pronto, 'cidade', ctx, pronto.waId)
    expect(r.contato?.cidadeId).toBeNull()
  })

  it('cidade que saiu do ar volta para a escolha', () => {
    const r = responder({ waId: pronto.waId, cidadeId: 'sumiu-mt' }, 'tenis', ctx, pronto.waId)
    expect(r.contato?.cidadeId).toBeNull()
  })
})

describe('SAIR e mensagens estranhas', () => {
  it('SAIR apaga o contato em qualquer etapa', () => {
    expect(responder(pronto, 'SAIR', ctx, pronto.waId).contato).toBeNull()
    expect(responder(null, 'parar', ctx, novo.waId).contato).toBeNull()
  })

  it('foto ou áudio (texto vazio) pede texto', () => {
    expect(texto(responder(pronto, '', ctx, pronto.waId))).toContain('por texto')
  })

  it('texto enorme é cortado antes de buscar', () => {
    expect(texto(responder(pronto, 'a'.repeat(5000), ctx, pronto.waId)).length).toBeLessThan(1000)
  })
})
