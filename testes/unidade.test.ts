import { describe, expect, it } from 'vitest'
import { lerQuantidade, precoPorUnidade } from '../src/dominio/unidade'

describe('lerQuantidade', () => {
  it('lê peso e volume nas formas do panfleto', () => {
    expect(lerQuantidade('5 kg')).toEqual({ valor: 5000, base: 'g' })
    expect(lerQuantidade('500g')).toEqual({ valor: 500, base: 'g' })
    expect(lerQuantidade('1,5 KG')).toEqual({ valor: 1500, base: 'g' })
    expect(lerQuantidade('2L')).toEqual({ valor: 2000, base: 'ml' })
    expect(lerQuantidade('350 ml')).toEqual({ valor: 350, base: 'ml' })
    expect(lerQuantidade('1 litro')).toEqual({ valor: 1000, base: 'ml' })
  })

  it('lê unidades e embalagens', () => {
    expect(lerQuantidade('12 un')).toEqual({ valor: 12, base: 'un' })
    expect(lerQuantidade('dúzia')).toEqual({ valor: 12, base: 'un' })
    expect(lerQuantidade('kg')).toEqual({ valor: 1000, base: 'g' })
  })

  it('lê pacote com várias unidades de um peso', () => {
    expect(lerQuantidade('6 x 1L')).toEqual({ valor: 6000, base: 'ml' })
    expect(lerQuantidade('12x350ml')).toEqual({ valor: 4200, base: 'ml' })
  })

  it('devolve null quando não entende', () => {
    expect(lerQuantidade('')).toBeNull()
    expect(lerQuantidade('pacote')).toBeNull()
    expect(lerQuantidade('0 kg')).toBeNull()
  })
})

describe('precoPorUnidade', () => {
  it('calcula R$/kg, R$/L e R$/un', () => {
    expect(precoPorUnidade(499, { valor: 500, base: 'g' })).toEqual({ centavos: 998, por: 'kg' })
    expect(precoPorUnidade(899, { valor: 2000, base: 'ml' })).toEqual({ centavos: 450, por: 'L' })
    expect(precoPorUnidade(1200, { valor: 12, base: 'un' })).toEqual({ centavos: 100, por: 'un' })
  })

  it('arredonda para o centavo mais próximo', () => {
    expect(precoPorUnidade(1000, { valor: 3, base: 'un' })).toEqual({ centavos: 333, por: 'un' })
  })

  it('sem quantidade não há preço por unidade', () => {
    expect(precoPorUnidade(499, null)).toBeNull()
  })
})
