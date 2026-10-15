import { describe, expect, it } from 'vitest'
import { emReais, paraCentavos } from '../src/dominio/dinheiro'

describe('paraCentavos', () => {
  it('lê o jeito brasileiro de escrever preço', () => {
    expect(paraCentavos('4,99')).toBe(499)
    expect(paraCentavos('R$ 1.299,90')).toBe(129990)
    expect(paraCentavos('12')).toBe(1200)
    expect(paraCentavos('0,5')).toBe(50)
  })

  it('aceita ponto como decimal quando não há vírgula e são 1 ou 2 casas', () => {
    expect(paraCentavos('4.99')).toBe(499)
    expect(paraCentavos('4.9')).toBe(490)
  })

  it('ponto com 3 casas é milhar', () => {
    expect(paraCentavos('1.299')).toBe(129900)
  })

  it('aceita número que já vem como número (reais)', () => {
    expect(paraCentavos(4.99)).toBe(499)
    expect(paraCentavos(0.1 + 0.2)).toBe(30)
  })

  it('devolve null para o que não é preço', () => {
    expect(paraCentavos('')).toBeNull()
    expect(paraCentavos('grátis')).toBeNull()
    expect(paraCentavos('-3,00')).toBeNull()
    expect(paraCentavos(Number.NaN)).toBeNull()
    expect(paraCentavos('1,2,3')).toBeNull()
  })
})

describe('emReais', () => {
  it('mostra centavos como R$', () => {
    expect(emReais(499)).toBe('R$ 4,99')
    expect(emReais(129990)).toBe('R$ 1.299,90')
    expect(emReais(0)).toBe('R$ 0,00')
  })
})
