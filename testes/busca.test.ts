import { describe, expect, it } from 'vitest'
import { buscar, comparacao, normalizar } from '../src/dominio/busca'
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

  it('sem quantidade em alguma, ordena pelo preço e diz que não dá para comparar por kg', () => {
    const lista = [
      oferta({ id: 'kg', produto: 'Picanha', quantidade: 'kg', preco: 5990 }),
      oferta({ id: 'sem', produto: 'Picanha', quantidade: '', preco: 3990 })
    ]
    const achadas = buscar(lista, 'picanha')
    expect(achadas.map((o) => o.id)).toEqual(['sem', 'kg'])
    expect(comparacao(achadas)).toBeNull()
  })

  it('não compara R$/un com R$/L', () => {
    const lista = [
      oferta({ id: 'pack', produto: 'Cerveja', quantidade: '12 x 350ml', preco: 3990 }),
      oferta({ id: 'un', produto: 'Cerveja', quantidade: '1 un', preco: 399 })
    ]
    const achadas = buscar(lista, 'cerveja')
    expect(achadas.map((o) => o.id)).toEqual(['un', 'pack'])
    expect(comparacao(achadas)).toBeNull()
  })

  it('todas na mesma unidade: compara por kg', () => {
    expect(comparacao(buscar(ofertas, 'arroz'))).toBe('kg')
  })

  it('plural e singular casam nos dois sentidos', () => {
    const lista = [
      oferta({ id: 't', produto: 'Tomates' }),
      oferta({ id: 'd', produto: 'Detergente' }),
      oferta({ id: 'p', produto: 'Pães Franceses' }),
      oferta({ id: 'l', produto: 'Limão Tahiti' })
    ]
    expect(buscar(lista, 'tomate').map((o) => o.id)).toEqual(['t'])
    expect(buscar(lista, 'detergentes').map((o) => o.id)).toEqual(['d'])
    expect(buscar(lista, 'pão').map((o) => o.id)).toEqual(['p'])
    expect(buscar(lista, 'limões').map((o) => o.id)).toEqual(['l'])
  })

  it('ignora de, do, da, com', () => {
    const lista = [oferta({ id: 'o', produto: 'Óleo Soja', quantidade: '900 ml' })]
    expect(buscar(lista, 'oleo de soja').map((o) => o.id)).toEqual(['o'])
  })

  it('busca vazia não devolve nada', () => {
    expect(buscar(ofertas, '   ')).toEqual([])
  })
})
