import { describe, expect, it } from 'vitest'
import { buscar, normalizar } from '../src/dominio/busca'

function p(id: string, titulo: string, lojaNome = 'Loja', descricao = '') {
  return { id, titulo, descricao, lojaNome }
}

describe('normalizar', () => {
  it('tira acento, maiúscula e pontuação, separa número da unidade', () => {
    expect(normalizar('Feijão  CARIOCA, Tipo-1')).toBe('feijao carioca tipo 1')
    expect(normalizar('Arroz 5kg')).toBe('arroz 5 kg')
  })
})

describe('buscar', () => {
  const produtos = [
    p('t', 'Tênis Nike Revolution', 'Casa do Tênis'),
    p('c', 'Camiseta Polo', 'Moda Center', 'algodão, tamanhos P a GG'),
    p('l', 'Limões Tahiti 1 kg', 'Hortifruti'),
    p('o', 'Óleo Soja 900 ml', 'Atacadão')
  ]

  it('acha pelo título, sem acento e sem maiúscula', () => {
    expect(buscar(produtos, 'TENIS').map((x) => x.id)).toEqual(['t'])
  })

  it('acha pela descrição e pelo nome da loja', () => {
    expect(buscar(produtos, 'algodao').map((x) => x.id)).toEqual(['c'])
    expect(buscar(produtos, 'atacadao').map((x) => x.id)).toEqual(['o'])
  })

  it('plural e singular casam nos dois sentidos; "de" não atrapalha', () => {
    expect(buscar(produtos, 'limão').map((x) => x.id)).toEqual(['l'])
    expect(buscar(produtos, 'camisetas').map((x) => x.id)).toEqual(['c'])
    expect(buscar(produtos, 'oleo de soja').map((x) => x.id)).toEqual(['o'])
  })

  it('título vem antes de descrição e loja', () => {
    const lista = [p('d', 'Bermuda', 'Loja', 'combina com tênis'), p('t', 'Tênis Olympikus')]
    expect(buscar(lista, 'tenis').map((x) => x.id)).toEqual(['t', 'd'])
  })

  it('busca vazia não devolve nada', () => {
    expect(buscar(produtos, '  ')).toEqual([])
  })
})
