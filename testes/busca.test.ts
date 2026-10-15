import { describe, expect, it } from 'vitest'
import { buscar, normalizar } from '../src/dominio/busca'
import type { OfertaNaVitrine } from '../src/dominio/tipos'

function oferta(parcial: Partial<OfertaNaVitrine>): OfertaNaVitrine {
  return {
    id: parcial.id ?? 'x',
    produto: 'Produto',
    marca: '',
    quantidade: '',
    preco: 100,
    precoDe: null,
    condicao: '',
    mercadoId: 'm1',
    mercadoNome: 'Mercado',
    panfletoId: 'p1',
    ...parcial
  }
}

describe('normalizar', () => {
  it('tira acento, maiúscula e pontuação', () => {
    expect(normalizar('Feijão  CARIOCA, Tipo-1')).toBe('feijao carioca tipo 1')
  })

  it('separa número grudado na unidade', () => {
    expect(normalizar('Arroz 5kg')).toBe('arroz 5 kg')
  })
})

describe('buscar', () => {
  const ofertas = [
    oferta({ id: 'a', produto: 'Arroz Tipo 1', marca: 'Tio João', quantidade: '5 kg', preco: 2799 }),
    oferta({ id: 'b', produto: 'Arroz Parboilizado', marca: 'Camil', quantidade: '1 kg', preco: 649 }),
    oferta({ id: 'c', produto: 'Feijão Carioca', marca: 'Kicaldo', quantidade: '1 kg', preco: 799 }),
    oferta({ id: 'd', produto: 'Picanha Bovina', quantidade: 'kg', preco: 6990 }),
    oferta({ id: 'e', produto: 'Bananas Prata', quantidade: '', preco: 399 })
  ]

  it('acha pelo nome, sem acento e sem maiúscula', () => {
    expect(buscar(ofertas, 'FEIJAO').map((o) => o.id)).toEqual(['c'])
  })

  it('exige todas as palavras', () => {
    expect(buscar(ofertas, 'arroz camil').map((o) => o.id)).toEqual(['b'])
  })

  it('casa a quantidade escrita junta', () => {
    expect(buscar(ofertas, 'arroz 5kg').map((o) => o.id)).toEqual(['a'])
  })

  it('casa singular com plural', () => {
    expect(buscar(ofertas, 'banana').map((o) => o.id)).toEqual(['e'])
    expect(buscar(ofertas, 'picanhas').map((o) => o.id)).toEqual(['d'])
  })

  it('ordena pelo preço por kg quando dá para comparar', () => {
    // 5 kg por 27,99 = 5,60/kg ; 1 kg por 6,49 = 6,49/kg
    expect(buscar(ofertas, 'arroz').map((o) => o.id)).toEqual(['a', 'b'])
  })

  it('quem não tem quantidade vai depois de quem tem', () => {
    const lista = [
      oferta({ id: 's', produto: 'Leite', quantidade: '', preco: 300 }),
      oferta({ id: 't', produto: 'Leite', quantidade: '1 L', preco: 499 })
    ]
    expect(buscar(lista, 'leite').map((o) => o.id)).toEqual(['t', 's'])
  })

  it('busca vazia não devolve nada', () => {
    expect(buscar(ofertas, '   ')).toEqual([])
  })
})
