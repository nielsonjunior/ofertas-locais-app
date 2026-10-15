import { describe, expect, it } from 'vitest'
import { EsquemaDaLeitura, limparLeitura } from '../src/dominio/leitura'

function item(parcial: Record<string, unknown>) {
  return {
    produto: 'Arroz Tipo 1', marca: 'Tio João', quantidade: '5 kg',
    preco: '27,99', precoDe: null, condicao: null, certeza: 'alta', ...parcial
  }
}

describe('EsquemaDaLeitura', () => {
  it('aceita o formato que pedimos à IA', () => {
    const ok = EsquemaDaLeitura.safeParse({
      validoDe: '2026-10-13', validoAte: '2026-10-19', ofertas: [item({})]
    })
    expect(ok.success).toBe(true)
  })

  it('recusa certeza fora de alta/baixa', () => {
    const r = EsquemaDaLeitura.safeParse({ validoDe: null, validoAte: null, ofertas: [item({ certeza: 'talvez' })] })
    expect(r.success).toBe(false)
  })
})

describe('limparLeitura', () => {
  it('converte preço para centavos e limpa espaços', () => {
    const r = limparLeitura({ validoDe: null, validoAte: null, ofertas: [item({ produto: '  Arroz  Tipo 1 ' })] }, 2)
    expect(r.ofertas).toEqual([{
      produto: 'Arroz Tipo 1', marca: 'Tio João', quantidade: '5 kg', preco: 2799,
      precoDe: null, condicao: '', pagina: 2, confianca: 'alta'
    }])
  })

  it('descarta item sem produto ou com preço que não é preço', () => {
    const r = limparLeitura({
      validoDe: null, validoAte: null,
      ofertas: [item({ produto: '' }), item({ preco: 'consulte' }), item({ preco: '0,00' }), item({})]
    }, 1)
    expect(r.ofertas).toHaveLength(1)
    expect(r.descartadas).toBe(3)
  })

  it('"de" menor ou igual ao "por" não é desconto e some', () => {
    const r = limparLeitura({ validoDe: null, validoAte: null, ofertas: [item({ precoDe: '20,00' })] }, 1)
    expect(r.ofertas[0]?.precoDe).toBeNull()
    const r2 = limparLeitura({ validoDe: null, validoAte: null, ofertas: [item({ precoDe: '32,90' })] }, 1)
    expect(r2.ofertas[0]?.precoDe).toBe(3290)
  })

  it('preço com cara de erro de leitura vira certeza baixa', () => {
    const r = limparLeitura({ validoDe: null, validoAte: null, ofertas: [item({ preco: '2799' })] }, 1)
    expect(r.ofertas[0]?.confianca).toBe('baixa')
  })

  it('tira repetido (mesmo produto, quantidade e preço)', () => {
    const r = limparLeitura({ validoDe: null, validoAte: null, ofertas: [item({}), item({ produto: 'arroz tipo 1' })] }, 1)
    expect(r.ofertas).toHaveLength(1)
  })

  it('validade só passa se for data de verdade e na ordem certa', () => {
    expect(limparLeitura({ validoDe: '2026-10-13', validoAte: '2026-10-19', ofertas: [] }, 1).validade)
      .toEqual({ validoDe: '2026-10-13', validoAte: '2026-10-19' })
    expect(limparLeitura({ validoDe: '2026-10-19', validoAte: '2026-10-13', ofertas: [] }, 1).validade).toBeNull()
    expect(limparLeitura({ validoDe: '13/10', validoAte: '2026-10-19', ofertas: [] }, 1).validade).toBeNull()
  })

  it('corta texto comprido demais', () => {
    const r = limparLeitura({ validoDe: null, validoAte: null, ofertas: [item({ produto: 'x'.repeat(500) })] }, 1)
    expect(r.ofertas[0]?.produto.length).toBe(120)
  })
})
