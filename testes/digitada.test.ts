import { describe, expect, it } from 'vitest'
import { validarOfertaDigitada } from '../src/dominio/digitada'

describe('validarOfertaDigitada', () => {
  it('aceita o que a conferência manda e converte o preço', () => {
    expect(validarOfertaDigitada({
      produto: ' Arroz ', marca: 'Camil', quantidade: '5 kg', preco: '27,99', precoDe: '32,90', condicao: ''
    })).toEqual({ produto: 'Arroz', marca: 'Camil', quantidade: '5 kg', preco: 2799, precoDe: 3290, condicao: '' })
  })

  it('exige produto e preço de verdade', () => {
    expect(() => validarOfertaDigitada({ produto: '', preco: '1,00' })).toThrow('produto')
    expect(() => validarOfertaDigitada({ produto: 'Arroz', preco: 'x' })).toThrow('preço')
    expect(() => validarOfertaDigitada({ produto: 'Arroz', preco: '0' })).toThrow('preço')
  })

  it('"de" que não é maior que o "por" é recusado', () => {
    expect(() => validarOfertaDigitada({ produto: 'Arroz', preco: '10,00', precoDe: '9,00' })).toThrow('"de"')
  })

  it('campo que não é texto vira vazio; texto comprido é recusado', () => {
    expect(validarOfertaDigitada({ produto: 'Arroz', preco: '1,00', marca: 42 }).marca).toBe('')
    expect(() => validarOfertaDigitada({ produto: 'x'.repeat(200), preco: '1,00' })).toThrow('comprido')
  })
})
