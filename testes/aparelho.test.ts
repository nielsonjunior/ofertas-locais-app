import { describe, expect, it } from 'vitest'
import {
  alternarSeguida, atualizarSalvos, comPrimeiroNaFrente, estaPerto, lembrarBusca, MAXIMO_DE_BUSCAS
} from '../src/dominio/aparelho'
import type { ProdutoNaVitrine } from '../src/dominio/tipos'

function produto(id: string, extra: Partial<ProdutoNaVitrine> = {}): ProdutoNaVitrine {
  return {
    id, titulo: `Produto ${id}`, descricao: '', categoria: 'roupas', preco: 1000, precoDe: null, fotos: [],
    lojaId: 'l1', lojaNome: 'Loja', lojaWhatsapp: '65999990000', criadoEm: '2026-10-16T00:00:00.000Z', ...extra
  }
}

describe('estaPerto (o feed só monta o que está perto da tela)', () => {
  it('monta o atual, dois para trás e três para a frente', () => {
    const perto = [...Array(10).keys()].filter((i) => estaPerto(i, 5))
    expect(perto).toEqual([3, 4, 5, 6, 7, 8])
  })
  it('no começo, monta só os primeiros', () => {
    expect([...Array(10).keys()].filter((i) => estaPerto(i, 0))).toEqual([0, 1, 2, 3])
  })
})

describe('comPrimeiroNaFrente (produto aberto por link, e o feed continua)', () => {
  it('põe o produto na frente e não o repete', () => {
    const lista = comPrimeiroNaFrente(produto('b'), [produto('a'), produto('b'), produto('c')])
    expect(lista.map((p) => p.id)).toEqual(['b', 'a', 'c'])
  })
  it('sem produto, devolve o feed como veio', () => {
    expect(comPrimeiroNaFrente(null, [produto('a')]).map((p) => p.id)).toEqual(['a'])
  })
})

describe('lembrarBusca', () => {
  it('a mais recente primeiro, sem repetir (nem por maiúscula ou espaço)', () => {
    expect(lembrarBusca(['bolo', 'Tênis'], '  tênis ')).toEqual(['tênis', 'bolo'])
  })
  it('guarda no máximo algumas e ignora busca vazia', () => {
    const muitas = [...Array(20).keys()].map((i) => `b${i}`)
    expect(lembrarBusca(muitas, 'nova')).toHaveLength(MAXIMO_DE_BUSCAS)
    expect(lembrarBusca(['bolo'], '   ')).toEqual(['bolo'])
  })
})

describe('alternarSeguida', () => {
  it('segue e deixa de seguir', () => {
    const seguindo = alternarSeguida([], { id: 'l1', nome: 'Casa do Tênis' })
    expect(seguindo).toEqual([{ id: 'l1', nome: 'Casa do Tênis' }])
    expect(alternarSeguida(seguindo, { id: 'l1', nome: 'Casa do Tênis' })).toEqual([])
  })
  it('a mais nova fica na frente', () => {
    const lista = alternarSeguida([{ id: 'l1', nome: 'A' }], { id: 'l2', nome: 'B' })
    expect(lista.map((l) => l.id)).toEqual(['l2', 'l1'])
  })
})

describe('atualizarSalvos (salvo guarda o preço do dia; o servidor diz o de hoje)', () => {
  it('troca pelo que está no ar e marca o que saiu', () => {
    const salvos = [produto('a', { preco: 5000 }), produto('b')]
    const resultado = atualizarSalvos(salvos, [produto('a', { preco: 3990 })])
    expect(resultado).toEqual([
      { ...produto('a', { preco: 3990 }), indisponivel: false },
      { ...produto('b'), indisponivel: true }
    ])
  })
  it('mantém a ordem dos salvos', () => {
    const r = atualizarSalvos([produto('b'), produto('a')], [produto('a'), produto('b')])
    expect(r.map((p) => p.id)).toEqual(['b', 'a'])
  })
})
