import { describe, expect, it } from 'vitest'
import { CATEGORIAS } from '../src/dominio/categorias'
import { gerarExemplos, LIMITE_DE_EXEMPLOS } from '../src/dominio/exemplos'
import { validarLoja, validarProduto } from '../src/dominio/cadastro'

describe('gerarExemplos', () => {
  const { lojas, produtos } = gerarExemplos({ lojas: 40, produtosPorLoja: 25, semente: 1, agora: new Date('2026-10-16T12:00:00Z') })

  it('gera a quantidade pedida', () => {
    expect(lojas).toHaveLength(40)
    expect(produtos).toHaveLength(1000)
  })

  it('cobre todas as categorias', () => {
    expect(new Set(produtos.map((p) => p.categoria))).toEqual(new Set(CATEGORIAS.map((c) => c.id)))
  })

  it('tudo passa pelas mesmas regras do cadastro de verdade', () => {
    for (const l of lojas) expect(() => validarLoja({ ...l })).not.toThrow()
    for (const p of produtos) {
      expect(() => validarProduto({ ...p, preco: (p.preco / 100).toFixed(2).replace('.', ','), precoDe: p.precoDe ? (p.precoDe / 100).toFixed(2).replace('.', ',') : '' })).not.toThrow()
    }
  })

  it('preço "de" sempre maior que o preço, quando há', () => {
    for (const p of produtos) if (p.precoDe !== null) expect(p.precoDe).toBeGreaterThan(p.preco)
    expect(produtos.some((p) => p.precoDe !== null)).toBe(true)
  })

  it('fotos são as imagens de exemplo do próprio site, da categoria do produto', () => {
    for (const p of produtos) {
      expect(p.fotos.length).toBeGreaterThanOrEqual(1)
      for (const f of p.fotos) expect(f).toMatch(new RegExp(`^/exemplos/${p.categoria}-[1-4]\\.jpg$`))
    }
  })

  it('datas espalhadas nos últimos 7 dias, para o feed ter ordem variada', () => {
    const datas = produtos.map((p) => Date.parse(p.criadoEm))
    expect(Math.max(...datas)).toBeLessThanOrEqual(Date.parse('2026-10-16T12:00:00Z'))
    expect(Math.min(...datas)).toBeGreaterThanOrEqual(Date.parse('2026-10-09T12:00:00Z'))
  })

  it('mesma semente, mesmo resultado; ids únicos', () => {
    const outra = gerarExemplos({ lojas: 40, produtosPorLoja: 25, semente: 1, agora: new Date('2026-10-16T12:00:00Z') })
    expect(outra.produtos.map((p) => p.titulo)).toEqual(produtos.map((p) => p.titulo))
    expect(new Set(lojas.map((l) => l.nome)).size).toBe(40)
  })

  it('recusa passar do limite', () => {
    expect(() => gerarExemplos({ lojas: 200, produtosPorLoja: 50, semente: 1 })).toThrow(String(LIMITE_DE_EXEMPLOS))
    expect(() => gerarExemplos({ lojas: 0, produtosPorLoja: 10, semente: 1 })).toThrow()
  })
})
